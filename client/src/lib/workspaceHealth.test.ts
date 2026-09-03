import { describe, expect, it } from "vitest";
import { getWorkspaceHealth } from "./workspaceHealth";

describe("getWorkspaceHealth", () => {
  it("reports live record counts and labels demonstration records by collection", () => {
    const health = getWorkspaceHealth({
      clients: [{ isDemo: true }, { isDemo: false }],
      sites: [{ isDemo: true }],
      workOrders: [{ isDemo: false }],
      exceptions: [{ isDemo: false }],
    });

    expect(health).toMatchObject({ totalCount: 5, demoCount: 2, liveCount: 3, isEmpty: false });
    expect(health.items).toEqual([
      { key: "clients", label: "Clients", href: "/clients?filter=all", count: 2, demoCount: 1 },
      { key: "sites", label: "Sites", href: "/clients?view=sites", count: 1, demoCount: 1 },
      { key: "workOrders", label: "Work orders", href: "/service?status=all", count: 1, demoCount: 0 },
      { key: "exceptions", label: "Exceptions", href: "/exceptions?status=all", count: 1, demoCount: 0 },
    ]);
  });

  it("returns a clear zero-record empty state", () => {
    expect(getWorkspaceHealth({ clients: [], sites: [], workOrders: [], exceptions: [] })).toMatchObject({
      totalCount: 0,
      demoCount: 0,
      liveCount: 0,
      isEmpty: true,
    });
  });
});
