import { describe, expect, it } from "vitest";
import { evaluateServiceReadiness } from "./serviceReadiness";

const completeChecklist = [{ unitId: 7, completed: true, specificationMismatch: false }];
const healthyUnit = [{ id: 7, hydrostaticTestDue: new Date(Date.now() + 86_400_000) }];

describe("FireGuard service certificate readiness", () => {
  it("requires a complete checklist and both before-and-after evidence before certificate readiness", () => {
    expect(evaluateServiceReadiness({ checklist: completeChecklist, evidence: [], units: healthyUnit }).certificateReady).toBe(false);
    expect(evaluateServiceReadiness({ checklist: completeChecklist, evidence: [{ unitId: 7, phase: "before", isFlagged: false }, { unitId: 7, phase: "after", isFlagged: false }], units: healthyUnit })).toMatchObject({ evidenceReady: true, certificateReady: true, blockReason: null });
  });

  it("blocks readiness for flagged evidence and overdue hydrostatic testing", () => {
    expect(evaluateServiceReadiness({ checklist: completeChecklist, evidence: [{ unitId: 7, phase: "before", isFlagged: true }, { unitId: 7, phase: "after", isFlagged: false }], units: healthyUnit }).blockReason).toMatch(/Flagged evidence/);
    expect(evaluateServiceReadiness({ checklist: completeChecklist, evidence: [{ unitId: 7, phase: "before", isFlagged: false }, { unitId: 7, phase: "after", isFlagged: false }], units: [{ id: 7, hydrostaticTestDue: new Date(Date.now() - 86_400_000) }] }).blockReason).toMatch(/hydrostatic/);
  });
});
