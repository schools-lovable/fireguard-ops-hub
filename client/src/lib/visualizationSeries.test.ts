import { describe, expect, it } from "vitest";
import { buildEvidenceProgressSeries, buildScheduledWorkOrderVolumeSeries, buildSiteCoverageSeries, buildWorkOrderStatusSeries } from "./visualizationSeries";

const workOrders = [
  { id: 3, scheduledFor: new Date("2026-08-29T09:00:00Z"), evidenceProgress: 120, status: "complete" as const },
  { id: 1, scheduledFor: new Date("2026-08-24T09:00:00Z"), evidenceProgress: 42, status: "in_progress" as const },
  { id: 2, scheduledFor: new Date("2026-08-26T09:00:00Z"), evidenceProgress: -4, status: "blocked" as const },
];

describe("workspace visualization series", () => {
  it("derives date-ordered, safely bounded evidence points from current work-order data", () => {
    const series = buildEvidenceProgressSeries(workOrders);
    expect(series.map(point => point.id)).toEqual(["work-1", "work-2", "work-3"]);
    expect(series.map(point => point.value)).toEqual([42, 0, 100]);
    expect(series.map(point => point.detail)).toEqual(["In progress", "Blocked", "Complete"]);
  });

  it("uses real work-order status counts and retains a truthful no-work fallback", () => {
    const statusSeries = buildWorkOrderStatusSeries(workOrders);
    expect(statusSeries.find(point => point.id === "in_progress")?.value).toBe(1);
    expect(statusSeries.find(point => point.id === "blocked")?.detail).toBe("1 live work order");
    expect(buildEvidenceProgressSeries([])).toEqual([{ id: "no-work", label: "No work", value: 0, detail: "No scheduled work orders" }]);
  });

  it("groups scheduled workload volume by actual service date rather than fabricating activity", () => {
    const series = buildScheduledWorkOrderVolumeSeries([...workOrders, { id: 4, scheduledFor: new Date("2026-08-26T14:00:00Z"), evidenceProgress: 61, status: "scheduled" }]);
    expect(series.map(point => point.value)).toEqual([1, 2, 1]);
    expect(series[1].detail).toBe("2 scheduled work orders");
  });

  it("uses bounded live site metrics for coverage rather than a static map image", () => {
    expect(buildSiteCoverageSeries(8, 3)).toEqual([
      { id: "ready", label: "Ready", value: 3, detail: "3 sites ready for inspection" },
      { id: "attention", label: "Attention", value: 5, detail: "5 sites need readiness attention" },
    ]);
    expect(buildSiteCoverageSeries(0, 0)).toEqual([{ id: "no-sites", label: "No sites", value: 0, detail: "No managed sites" }]);
  });
});
