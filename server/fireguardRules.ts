/** FireGuard access and scheduling rules centralize role capabilities and deterministic digest identity. */
export type FireGuardRole = "user" | "field" | "reviewer" | "manager" | "admin" | "technician" | "sales" | "finance";

export const canPerformFieldWork = (role: FireGuardRole) => ["field", "technician", "manager", "admin"].includes(role);
export const canCaptureSiteLocation = (role: FireGuardRole) => ["field", "technician", "sales", "manager", "admin"].includes(role);
export const canReviewEvidence = (role: FireGuardRole) => ["reviewer", "manager", "admin"].includes(role);
export const canManageOperations = (role: FireGuardRole) => ["manager", "admin"].includes(role);
export const canEditClientRegistry = (role: FireGuardRole) => ["sales", "manager", "admin"].includes(role);

export function exceptionDigestKey(date: Date, scope = "daily") {
  const utcDay = date.toISOString().slice(0, 10);
  return `exception-${scope}-${utcDay}`;
}

export function buildExceptionDigestCopy(openCount: number, overdueCount: number) {
  if (openCount === 0) {
    return { title: "Exception digest: queue clear", body: "No unresolved FireGuard exceptions require action today." };
  }

  const overdueClause = overdueCount > 0 ? ` ${overdueCount} ${overdueCount === 1 ? "item is" : "items are"} overdue.` : "";
  return {
    title: `Exception digest: ${openCount} ${openCount === 1 ? "item" : "items"} need attention`,
    body: `Review and assign owners for the unresolved safety exceptions in your queue.${overdueClause}`,
  };
}
