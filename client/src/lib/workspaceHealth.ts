export type WorkspaceHealthKey = "clients" | "sites" | "workOrders" | "exceptions";

type RecordWithDemoFlag = { isDemo?: boolean | null };

export type WorkspaceHealthItem = {
  key: WorkspaceHealthKey;
  label: string;
  href: string;
  count: number;
  demoCount: number;
};

export type WorkspaceHealthSummary = {
  items: WorkspaceHealthItem[];
  totalCount: number;
  demoCount: number;
  liveCount: number;
  isEmpty: boolean;
};

export function getWorkspaceHealth(input: {
  clients: RecordWithDemoFlag[];
  sites: RecordWithDemoFlag[];
  workOrders: RecordWithDemoFlag[];
  exceptions: RecordWithDemoFlag[];
}): WorkspaceHealthSummary {
  const collections: Array<[WorkspaceHealthKey, string, string, RecordWithDemoFlag[]]> = [
    ["clients", "Clients", "/clients?filter=all", input.clients],
    ["sites", "Sites", "/clients?view=sites", input.sites],
    ["workOrders", "Work orders", "/service?status=all", input.workOrders],
    ["exceptions", "Exceptions", "/exceptions?status=all", input.exceptions],
  ];
  const items = collections.map(([key, label, href, records]) => ({
    key,
    label,
    href,
    count: records.length,
    demoCount: records.filter(record => Boolean(record.isDemo)).length,
  }));
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const demoCount = items.reduce((sum, item) => sum + item.demoCount, 0);
  return { items, totalCount, demoCount, liveCount: totalCount - demoCount, isEmpty: totalCount === 0 };
}
