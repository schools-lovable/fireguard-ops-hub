export function evaluateServiceReadiness(input: { checklist: Array<{ unitId: number; completed: boolean; specificationMismatch: boolean }>; evidence: Array<{ unitId: number; phase: "before" | "after"; isFlagged: boolean }>; units: Array<{ id: number; hydrostaticTestDue: Date | null }> }) {
  if (!input.checklist.length) return { evidenceReady: false, certificateReady: false, blockReason: "No assets are assigned to this service work order.", hasFlaggedEvidence: false };
  if (input.checklist.some(item => !item.completed)) return { evidenceReady: false, certificateReady: false, blockReason: "Every assigned extinguisher needs a completed checklist.", hasFlaggedEvidence: false };
  if (input.checklist.some(item => item.specificationMismatch)) return { evidenceReady: false, certificateReady: false, blockReason: "An extinguisher specification mismatch must be resolved.", hasFlaggedEvidence: false };
  const hasFlaggedEvidence = input.evidence.some(item => item.isFlagged);
  if (hasFlaggedEvidence) return { evidenceReady: false, certificateReady: false, blockReason: "Flagged evidence must be resolved before certificate readiness.", hasFlaggedEvidence };
  const pairsComplete = input.checklist.every(item => ["before", "after"].every(phase => input.evidence.some(evidence => evidence.unitId === item.unitId && evidence.phase === phase)));
  if (!pairsComplete) return { evidenceReady: false, certificateReady: false, blockReason: "Before-and-after evidence is required for every assigned extinguisher.", hasFlaggedEvidence };
  const overdueHydrostatic = input.units.some(unit => unit.hydrostaticTestDue && unit.hydrostaticTestDue < new Date());
  if (overdueHydrostatic) return { evidenceReady: true, certificateReady: false, blockReason: "An assigned extinguisher has an overdue hydrostatic test.", hasFlaggedEvidence };
  return { evidenceReady: true, certificateReady: true, blockReason: null, hasFlaggedEvidence };
}
