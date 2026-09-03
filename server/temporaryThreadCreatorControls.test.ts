import { describe, expect, it, vi } from "vitest";
import { persistManualTemporaryThreadArchive, persistTemporaryThreadExtension } from "./db";
import { canControlTemporaryThread, extendedTemporaryThreadExpiry } from "./temporaryThreadRules";

function updateDatabase() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  return { database: { update: vi.fn(() => ({ set })) }, set };
}

describe("temporary thread creator controls", () => {
  it("limits lifecycle control to the active temporary thread creator", () => {
    expect(canControlTemporaryThread({ isTemporary: true, archivedAt: null, createdByUserId: 6 }, 6)).toBe(true);
    expect(canControlTemporaryThread({ isTemporary: true, archivedAt: null, createdByUserId: 6 }, 8)).toBe(false);
    expect(canControlTemporaryThread({ isTemporary: false, archivedAt: null, createdByUserId: 6 }, 6)).toBe(false);
  });

  it("persists an extension from the current future expiry", async () => {
    const { database, set } = updateDatabase();
    const now = new Date("2026-08-24T10:00:00.000Z");
    const expiresAt = extendedTemporaryThreadExpiry(new Date("2026-08-25T10:00:00.000Z"), 24, now);
    await persistTemporaryThreadExtension(database as never, 91, expiresAt, now);
    expect(set).toHaveBeenCalledWith({ expiresAt: new Date("2026-08-26T10:00:00.000Z"), updatedAt: now });
  });

  it("persists a manual archive for the conversation and every member", async () => {
    const { database, set } = updateDatabase();
    const now = new Date("2026-08-24T10:00:00.000Z");
    await persistManualTemporaryThreadArchive(database as never, 91, now);
    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenNthCalledWith(1, { archivedAt: now, archiveReason: "manual", updatedAt: now });
    expect(set).toHaveBeenNthCalledWith(2, { archivedAt: now });
  });
});
