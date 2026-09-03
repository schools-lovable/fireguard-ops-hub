/** FireGuard rule tests protect role boundaries and scheduled digest idempotency keys. */
import { describe, expect, it } from "vitest";
import { buildExceptionDigestCopy, canManageOperations, canPerformFieldWork, canReviewEvidence, exceptionDigestKey } from "./fireguardRules";

describe("FireGuard role permissions", () => {
  it("limits field work, review, and management actions to their intended roles", () => {
    expect(canPerformFieldWork("field")).toBe(true);
    expect(canPerformFieldWork("reviewer")).toBe(false);
    expect(canReviewEvidence("reviewer")).toBe(true);
    expect(canReviewEvidence("field")).toBe(false);
    expect(canManageOperations("manager")).toBe(true);
    expect(canManageOperations("field")).toBe(false);
    expect(canManageOperations("admin")).toBe(true);
  });

  it("creates stable UTC keys so retried scheduled digests do not duplicate alerts", () => {
    expect(exceptionDigestKey(new Date("2026-08-24T00:05:00.000Z"))).toBe("exception-daily-2026-08-24");
    expect(buildExceptionDigestCopy(2, 1).body).toContain("1 item is overdue");
  });
});
