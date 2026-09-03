import { describe, expect, it } from "vitest";
import { canControlTemporaryThread, expiryFromHours, extendedTemporaryThreadExpiry, isTemporaryThreadArchived, temporaryThreadConversationValues } from "./temporaryThreadRules";

describe("temporary thread lifecycle rules", () => {
  it("calculates an expiry from the selected duration and rejects unsafe timer ranges", () => {
    const now = new Date("2026-08-24T10:00:00.000Z");
    expect(expiryFromHours(24, now).toISOString()).toBe("2026-08-25T10:00:00.000Z");
    expect(() => expiryFromHours(0, now)).toThrow("1 to 168 hours");
    expect(() => expiryFromHours(169, now)).toThrow("1 to 168 hours");
  });

  it("locks expired or explicitly archived temporary threads while leaving permanent groups active", () => {
    const now = new Date("2026-08-24T10:00:00.000Z");
    expect(isTemporaryThreadArchived({ isTemporary: true, expiresAt: new Date("2026-08-24T09:59:00.000Z"), archivedAt: null }, now)).toBe(true);
    expect(isTemporaryThreadArchived({ isTemporary: true, expiresAt: new Date("2026-08-24T10:01:00.000Z"), archivedAt: null }, now)).toBe(false);
    expect(isTemporaryThreadArchived({ isTemporary: false, expiresAt: null, archivedAt: null }, now)).toBe(false);
    expect(isTemporaryThreadArchived({ isTemporary: false, expiresAt: null, archivedAt: now }, now)).toBe(true);
  });

  it("preserves linked-client context and a custom duration in the conversation values sent to persistence", () => {
    const now = new Date("2026-08-24T10:00:00.000Z");
    expect(temporaryThreadConversationValues({ title: "Riverside handoff", contextLabel: "Riverside Tower annual service", clientId: 7, durationHours: 36 }, 12, now)).toMatchObject({
      kind: "group",
      title: "Riverside handoff",
      contextLabel: "Riverside Tower annual service",
      clientId: 7,
      isTemporary: true,
      createdByUserId: 12,
      expiresAt: new Date("2026-08-25T22:00:00.000Z"),
    });
  });

  it("extends from the existing future expiry and only permits the original creator to control an active temporary thread", () => {
    const now = new Date("2026-08-24T10:00:00.000Z");
    expect(extendedTemporaryThreadExpiry(new Date("2026-08-25T10:00:00.000Z"), 24, now).toISOString()).toBe("2026-08-26T10:00:00.000Z");
    expect(extendedTemporaryThreadExpiry(new Date("2026-08-24T09:00:00.000Z"), 24, now).toISOString()).toBe("2026-08-25T10:00:00.000Z");
    expect(canControlTemporaryThread({ isTemporary: true, archivedAt: null, createdByUserId: 4 }, 4)).toBe(true);
    expect(canControlTemporaryThread({ isTemporary: true, archivedAt: null, createdByUserId: 4 }, 9)).toBe(false);
    expect(canControlTemporaryThread({ isTemporary: true, archivedAt: now, createdByUserId: 4 }, 4)).toBe(false);
  });
});
