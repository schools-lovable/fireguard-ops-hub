/** FireGuard scheduled endpoint: daily exception digests authenticate as platform cron calls, look up the schedule by task UID, and run idempotently. */
import type { Request, Response } from "express";
import { archiveExpiredTemporaryThreads, createAcademyLearningReminders, createExceptionDigest, getAcademyReminderScheduleByTaskUid, getScheduleByTaskUid, getTemporaryThreadArchiveScheduleByTaskUid, recordAcademyReminderRun, recordScheduleRun, recordTemporaryThreadArchiveRun } from "./db";
import { sdk } from "./_core/sdk";

export async function runExceptionDigestSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const schedule = await getScheduleByTaskUid(user.taskUid);
    if (!schedule || !schedule.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const result = await createExceptionDigest("daily");
    await recordScheduleRun(schedule.id);
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown schedule failure";
    return res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}

export async function runAcademyReminderSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const schedule = await getAcademyReminderScheduleByTaskUid(user.taskUid);
    if (!schedule || !schedule.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const result = await createAcademyLearningReminders("daily");
    await recordAcademyReminderRun(schedule.id);
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Academy reminder failure";
    return res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}

/** Project-owned sweep that archives every temporary thread whose expiry time has passed. */
export async function runTemporaryThreadArchiveSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const schedule = await getTemporaryThreadArchiveScheduleByTaskUid(user.taskUid);
    if (!schedule || !schedule.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const result = await archiveExpiredTemporaryThreads();
    await recordTemporaryThreadArchiveRun(schedule.id);
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown temporary thread archive failure";
    return res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
