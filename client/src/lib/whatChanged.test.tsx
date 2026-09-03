import { describe, expect, it } from "vitest";
import { getWhatChanged, getWhatChangedEmptyCopy } from "./whatChanged";

const workspace = {
  workOrders: [
    { id: 1, title: "Hydrant inspection", siteName: "North Yard", status: "in_progress", scheduledFor: new Date("2026-08-25T08:00:00Z"), evidenceProgress: 42 },
    { id: 2, title: "Alarm test", siteName: "South Yard", status: "complete", scheduledFor: new Date("2026-08-24T08:00:00Z"), evidenceProgress: 100 },
  ],
  exceptions: [{ id: 3, title: "Evidence review needed", siteName: "North Yard", status: "open", severity: "high" as const, createdAt: new Date("2026-08-26T08:00:00Z") }],
};

describe("getWhatChanged", () => {
  it("keeps manager summaries operational and never includes exception-detail content", () => {
    const items = getWhatChanged(workspace, "manager");
    expect(items.map(item => item.kind)).toContain("risk");
    expect(items.map(item => item.title)).toContain("Evidence review needed");
    expect(items.some(item => item.summary.includes("device group"))).toBe(false);
  });

  it("limits field roles to active work changes and gives non-operational roles a safe empty state", () => {
    expect(getWhatChanged(workspace, "field").map(item => item.title)).toEqual(["Hydrant inspection"]);
    expect(getWhatChanged(workspace, "sales")).toEqual([]);
    expect(getWhatChangedEmptyCopy("sales")).toContain("current role");
  });
});
