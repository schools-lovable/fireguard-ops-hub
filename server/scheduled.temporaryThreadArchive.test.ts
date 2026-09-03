import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getSchedule: vi.fn(),
  archiveExpired: vi.fn(),
  recordRun: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: mocks.authenticateRequest },
}));

vi.mock("./db", () => ({
  createAcademyLearningReminders: vi.fn(),
  createExceptionDigest: vi.fn(),
  getAcademyReminderScheduleByTaskUid: vi.fn(),
  getScheduleByTaskUid: vi.fn(),
  recordAcademyReminderRun: vi.fn(),
  recordScheduleRun: vi.fn(),
  archiveExpiredTemporaryThreads: mocks.archiveExpired,
  getTemporaryThreadArchiveScheduleByTaskUid: mocks.getSchedule,
  recordTemporaryThreadArchiveRun: mocks.recordRun,
}));

import { runTemporaryThreadArchiveSchedule } from "./scheduled";

function response() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("runTemporaryThreadArchiveSchedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects calls that were not made by the platform cron identity", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: false });
    const res = response();
    await runTemporaryThreadArchiveSchedule({ originalUrl: "/api/scheduled/archive-temporary-threads" } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron-only" });
    expect(mocks.archiveExpired).not.toHaveBeenCalled();
  });

  it("treats an unknown or disabled schedule as an idempotent no-op", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "orphan-task" });
    mocks.getSchedule.mockResolvedValue(undefined);
    const res = response();
    await runTemporaryThreadArchiveSchedule({ originalUrl: "/api/scheduled/archive-temporary-threads" } as never, res as never);
    expect(res.json).toHaveBeenCalledWith({ ok: true, skipped: "orphan-or-disabled" });
    expect(mocks.archiveExpired).not.toHaveBeenCalled();
  });

  it("records a successful no-op sweep, so repeated runs are safe", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "archive-task" });
    mocks.getSchedule.mockResolvedValue({ id: 44, enabled: true });
    mocks.archiveExpired.mockResolvedValue({ archivedCount: 0 });
    const res = response();
    await runTemporaryThreadArchiveSchedule({ originalUrl: "/api/scheduled/archive-temporary-threads" } as never, res as never);
    expect(mocks.archiveExpired).toHaveBeenCalledOnce();
    expect(mocks.recordRun).toHaveBeenCalledWith(44);
    expect(res.json).toHaveBeenCalledWith({ ok: true, archivedCount: 0 });
  });
});
