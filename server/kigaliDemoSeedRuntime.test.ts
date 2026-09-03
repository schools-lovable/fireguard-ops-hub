import { describe, expect, it, vi } from "vitest";
import { clients, exceptions, siteLocationHistory, sites, workOrders } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ database: null as unknown }));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => mocks.database),
}));

import { getSiteLocationDetail, getWorkspaceSnapshot, listSitesWithLocations } from "./db";

type SeedRow = Record<string, unknown>;

function createSeedDatabase() {
  const state = {
    clientRows: [] as SeedRow[],
    siteRows: [] as SeedRow[],
    workRows: [] as SeedRow[],
    exceptionRows: [] as SeedRow[],
    locationHistoryRows: [] as SeedRow[],
  };
  const nextIds = new Map<unknown, number>([[clients, 1], [sites, 1], [workOrders, 1], [exceptions, 1]]);
  const rowsFor = (table: unknown) => {
    if (table === clients) return state.clientRows;
    if (table === sites) return state.siteRows;
    if (table === workOrders) return state.workRows;
    if (table === exceptions) return state.exceptionRows;
    if (table === siteLocationHistory) return state.locationHistoryRows;
    throw new Error("Unexpected table in Kigali seed test");
  };
  const project = (rows: SeedRow[], fields?: Record<string, unknown>) => !fields ? rows.map(row => ({ ...row })) : rows.map(row => Object.fromEntries(Object.entries(fields).map(([key, column]) => [key, row[(column as { name?: string }).name ?? key] ?? null])));
  const filteredRows = (table: unknown, rows: SeedRow[], condition: unknown) => {
    const chunks = (condition as { queryChunks?: unknown[] })?.queryChunks ?? [];
    const match = chunks.find(chunk => typeof (chunk as { value?: unknown })?.value === "number") as { value?: number } | undefined;
    if (typeof match?.value !== "number") return rows;
    if (table === sites) return rows.filter(row => row.id === match.value);
    if (table === workOrders || table === siteLocationHistory) return rows.filter(row => row.siteId === match.value);
    return rows;
  };
  const queryResult = (rows: SeedRow[], fields?: Record<string, unknown>) => {
    const result = project(rows, fields);
    return Object.assign(result, { limit: (count: number) => result.slice(0, count), orderBy: () => queryResult(rows, fields) });
  };
  const database = {
    select: (fields?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        const tableRows = rowsFor(table);
        return {
          where: (condition: unknown) => queryResult(filteredRows(table, tableRows, condition), fields),
          orderBy: () => project(tableRows, fields),
          innerJoin: () => ({
            where: (condition: unknown) => ({
              limit: (count: number) => filteredRows(table, tableRows, condition).map(site => ({
                ...site,
                clientName: state.clientRows.find(client => client.id === site.clientId)?.name ?? "Unknown client",
              })).slice(0, count),
            }),
            orderBy: () => tableRows.map(site => ({
              ...site,
              clientName: state.clientRows.find(client => client.id === site.clientId)?.name ?? "Unknown client",
            })),
          }),
        };
      },
    }),
    insert: (table: unknown) => ({
      values: (input: SeedRow | SeedRow[]) => {
        const target = rowsFor(table);
        for (const row of Array.isArray(input) ? input : [input]) {
          const nextId = nextIds.get(table) ?? 1;
          nextIds.set(table, nextId + 1);
          target.push({ ...row, id: row.id ?? nextId });
        }
        return Promise.resolve();
      },
    }),
    update: (table: unknown) => ({
      set: (values: SeedRow) => ({
        where: () => {
          rowsFor(table).forEach(row => Object.assign(row, values));
          return Promise.resolve();
        },
      }),
    }),
  };
  return { database, state };
}

describe("Kigali demonstration seed runtime", () => {
  it("builds the expanded Client Map and workspace payloads once, with linked demo operational records", async () => {
    const seed = createSeedDatabase();
    mocks.database = seed.database;
    process.env.DATABASE_URL = "mysql://kigali-demo-test";

    const firstMapPayload = await listSitesWithLocations();
    const workspace = await getWorkspaceSnapshot();
    const secondMapPayload = await listSitesWithLocations();

    expect(firstMapPayload).toHaveLength(27);
    expect(secondMapPayload).toHaveLength(27);
    expect(firstMapPayload.every(site => site.latitude !== null && site.longitude !== null)).toBe(true);
    expect(workspace.clients).toHaveLength(17);
    expect(workspace.sites).toHaveLength(27);
    expect(workspace.workOrders).toHaveLength(27);
    expect(workspace.exceptions).toHaveLength(11);
    expect(seed.state.workRows.every(work => seed.state.siteRows.some(site => site.id === work.siteId))).toBe(true);
    expect(seed.state.exceptionRows.every(exception => seed.state.siteRows.some(site => site.id === exception.siteId) && seed.state.workRows.some(work => work.id === exception.workOrderId))).toBe(true);
    const demoSite = seed.state.siteRows.find(site => site.isDemo);
    const detail = await getSiteLocationDetail(Number(demoSite?.id));

    expect(detail.isIllustrative).toBe(true);
    expect(detail.evidence).toHaveLength(2);
    expect(detail.evidence.every(item => item.imageUrl.startsWith("/manus-storage/") && /Demo only|No field image/.test(item.capturedLabel))).toBe(true);
    expect(detail.workOrders).toHaveLength(1);
    expect(detail.workOrders[0].illustrativeHistory).toHaveLength(3);

    seed.state.clientRows.push({ id: 990, name: "Operational Client", isDemo: false });
    seed.state.siteRows.push({ id: 991, clientId: 990, name: "Operational Site", address: "Kigali operational address", readinessStatus: "ready", latitude: "-1.9400", longitude: "30.0600", locationSource: "manual", locationCapturedAt: null, locationCapturedBy: null, locationAccuracyMeters: null, isDemo: false });
    const operationalDetail = await getSiteLocationDetail(991);
    expect(operationalDetail.isIllustrative).toBe(false);
    expect(operationalDetail.evidence).toEqual([]);
    expect(operationalDetail.workOrders).toEqual([]);
  });
});
