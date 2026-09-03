import { describe, expect, it } from "vitest";
import { buildIllustrativeSiteDrilldown } from "./siteDrilldownDemo";

const workOrder = { id: 14, title: "Kigali alarm inspection", workType: "Alarm system", status: "blocked" as const, evidenceProgress: 45, scheduledFor: new Date("2026-08-26T08:00:00.000Z"), dueAt: new Date("2026-08-27T15:00:00.000Z") };

describe("illustrative site drill-down content", () => {
  it("adds clearly labelled evidence examples and detailed timeline entries only for demo sites", () => {
    const drilldown = buildIllustrativeSiteDrilldown({ id: 8, name: "Kigali Heights · Main Arcade", clientName: "Kigali Heights · DEMO", readinessStatus: "risk", isDemo: true }, [workOrder]);
    expect(drilldown.isIllustrative).toBe(true);
    expect(drilldown.evidence).toHaveLength(2);
    expect(drilldown.evidence.every(item => /Demo only|No field image/.test(item.capturedLabel))).toBe(true);
    expect(drilldown.evidence.every(item => item.imageUrl.startsWith("/manus-storage/") && item.alt.length > 0)).toBe(true);
    expect(drilldown.workOrders[0].illustrativeHistory).toHaveLength(3);
    expect(drilldown.workOrders[0].illustrativeHistory.at(-1)?.kind).toBe("exception");
  });

  it("leaves real records without fabricated evidence or activity", () => {
    const drilldown = buildIllustrativeSiteDrilldown({ id: 9, name: "Real Client Site", clientName: "Real Client", readinessStatus: "ready", isDemo: false }, [workOrder]);
    expect(drilldown.isIllustrative).toBe(false);
    expect(drilldown.evidence).toHaveLength(0);
    expect(drilldown.workOrders[0].illustrativeHistory).toEqual([]);
  });
});
