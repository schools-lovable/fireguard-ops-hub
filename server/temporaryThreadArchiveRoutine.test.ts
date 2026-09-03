import { describe, expect, it, vi } from "vitest";
import { archiveExpiredTemporaryThreads } from "./db";

function databaseForExpiredRows(ids: number[]) {
  const selectWhere = vi.fn().mockResolvedValue(ids.map(id => ({ id })));
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const database = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) })),
    update: vi.fn(() => ({ set: updateSet })),
  };
  return { database, selectWhere, updateSet };
}

describe("archiveExpiredTemporaryThreads", () => {
  it("archives every expired temporary conversation and member inbox exactly once", async () => {
    const { database, updateSet } = databaseForExpiredRows([21, 22]);
    const result = await archiveExpiredTemporaryThreads(new Date("2026-08-24T10:00:00.000Z"), database as never);
    expect(result).toEqual({ archivedCount: 2 });
    expect(updateSet).toHaveBeenCalledTimes(2);
    expect(updateSet).toHaveBeenNthCalledWith(1, expect.objectContaining({ archiveReason: "expired" }));
    expect(updateSet).toHaveBeenNthCalledWith(2, expect.objectContaining({ archivedAt: expect.any(Date) }));
  });

  it("is an idempotent no-op when a repeat sweep finds no unarchived expired threads", async () => {
    const { database, updateSet } = databaseForExpiredRows([]);
    await expect(archiveExpiredTemporaryThreads(new Date("2026-08-24T10:00:00.000Z"), database as never)).resolves.toEqual({ archivedCount: 0 });
    expect(updateSet).not.toHaveBeenCalled();
  });
});
