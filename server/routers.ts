/** FireGuard tRPC contract: role-protected operations connect the UI to durable client, site, work-order, exception, notification, and export data. */
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acknowledgeException, addChatGroupMembers, addProfileCertification, archiveTemporaryThread, changeServiceWorkStatus, clockInProfile, clockOutProfile, completeAcademyLesson, createAcademyLearningReminders, createDirectChat, createExceptionDigest, createGroupChat, createTemporaryGroupChat, deleteProfileCertification, extendTemporaryThread, flagServiceEvidence, generateReportCsv, getAcademyCourseDetail, getAcademyDashboard, getAcademyManagerOverview, getAcademyReminderSchedule, getActiveUsers, getChatConversation, getChatInbox, getDigestSchedule, getPresenceAlertPreferences, getProfileDashboard, getServiceComplianceDetail, getTeamRoster, getWorkspaceSnapshot, issueServiceCertificate, listNotifications, markChatRead, markNotificationRead, resetProfilePin, reviewServiceWork, saveAcademyReminderSchedule, saveDigestSchedule, sendChatMessage, submitAcademyQuiz, toggleChatInboxControl, toggleChatReaction, touchUserPresence, updateCurrentProfileRole, updateEmployeeProfile, updatePresenceAlertPreferences, updateProfilePreferences, updateServiceChecklist, updateWorkOrderStatus, uploadServiceEvidence } from "./db";
import { canManageOperations, canPerformFieldWork, canReviewEvidence, type FireGuardRole } from "./fireguardRules";
import { isValidProfilePin } from "./profileRules";
import { authenticateWithLocalRolePin, getRequestThrottleKey, legacyPinRoles } from "./localPinAuth";
import { geocodeSiteAddress, getSiteLocationDetail, listSitesWithLocations, setSiteLocationFromGps, setSiteLocationManual } from "./db";
import { canCaptureSiteLocation } from "./fireguardRules";

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canManageOperations(ctx.user.role as FireGuardRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access is required for this FireGuard action." });
  return next();
});

const fieldProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canPerformFieldWork(ctx.user.role as FireGuardRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Field-team access is required for this FireGuard action." });
  return next();
});
const locationCaptureProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canCaptureSiteLocation(ctx.user.role as FireGuardRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Field, sales, or manager access is required to capture a site location." });
  return next();
});

const reviewProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canReviewEvidence(ctx.user.role as FireGuardRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Reviewer access is required for this FireGuard action." });
  return next();
});

const digestCron = z.string().regex(/^\d+\s+\d+\s+\d+\s+\*\s+\*\s+\*$/, "Use a six-part UTC schedule, for example: 0 0 9 * * *");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ role: z.enum(legacyPinRoles), pin: z.string().regex(/^\d{4,12}$/) })).mutation(async ({ ctx, input }) => {
      const result = await authenticateWithLocalRolePin({ pin: input.pin, role: input.role, requestKey: getRequestThrottleKey(ctx.req.headers) });
      if (!result.ok) {
        if (result.reason === "rate_limited") throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.` });
        if (result.reason === "inactive_account") throw new TRPCError({ code: "FORBIDDEN", message: "This FireGuard role account is inactive." });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "The selected role or PIN is incorrect." });
      }
      const token = await sdk.createSessionToken(result.user.openId, { name: result.user.name ?? roleAccountName(result.role), expiresInMs: 8 * 60 * 60 * 1000 });
      const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
      return { user: result.user, expiresInMinutes: 480 };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fireguard: router({
    workspace: protectedProcedure.query(() => getWorkspaceSnapshot()),
    permissions: protectedProcedure.query(({ ctx }) => ({ role: ctx.user.role, canPerformFieldWork: canPerformFieldWork(ctx.user.role as FireGuardRole), canReviewEvidence: canReviewEvidence(ctx.user.role as FireGuardRole), canManageOperations: canManageOperations(ctx.user.role as FireGuardRole) })),
    presence: router({
      active: protectedProcedure.query(() => getActiveUsers()),
      teamRoster: managerProcedure.query(() => getTeamRoster()),
      alertPreferences: managerProcedure.query(({ ctx }) => getPresenceAlertPreferences(ctx.user.id)),
      updateAlertPreferences: managerProcedure.input(z.object({ alertFieldTeam: z.boolean(), alertReviewers: z.boolean() })).mutation(({ ctx, input }) => updatePresenceAlertPreferences(ctx.user.id, input)),
      heartbeat: protectedProcedure.input(z.object({ route: z.string().min(1).max(160) })).mutation(async ({ ctx, input }) => {
        await touchUserPresence(ctx.user.id, input.route);
        return { ok: true } as const;
      }),
    }),
    profile: router({
      dashboard: protectedProcedure.query(({ ctx }) => getProfileDashboard(ctx.user.id)),
      updateIdentity: protectedProcedure.input(z.object({
        name: z.string().trim().min(1).max(120),
        employeeId: z.string().trim().max(64),
        phone: z.string().trim().max(40),
        title: z.string().trim().max(120),
        photoUrl: z.string().trim().url().or(z.literal("")),
        locations: z.array(z.string().trim().min(1).max(120)).max(12),
        employmentStatus: z.enum(["active", "on_leave", "terminated"]),
        hireDate: z.string().nullable().refine(value => !value || !Number.isNaN(new Date(value).getTime()), "Provide a valid hire date."),
      })).mutation(({ ctx, input }) => updateEmployeeProfile(ctx.user.id, { ...input, hireDate: input.hireDate ? new Date(input.hireDate) : null })),
      updatePreferences: protectedProcedure.input(z.object({
        notifyAssignments: z.boolean(),
        notifyExceptions: z.boolean(),
        notifyLearning: z.boolean(),
        language: z.enum(["en-US", "es-ES", "fr-FR", "pt-BR"]),
        compactDensity: z.boolean(),
      })).mutation(({ ctx, input }) => updateProfilePreferences(ctx.user.id, input)),
      resetPin: protectedProcedure.input(z.object({ pin: z.string().refine(isValidProfilePin, "Use a 4–6 digit PIN.") })).mutation(({ ctx, input }) => resetProfilePin(ctx.user.id, input.pin)),
      updateRole: protectedProcedure.input(z.object({ role: z.enum(["user", "field", "reviewer", "manager", "admin"]) })).mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required to change a FireGuard role." });
        return updateCurrentProfileRole(ctx.user.id, input.role);
      }),
      addCertification: protectedProcedure.input(z.object({
        name: z.string().trim().min(2).max(160),
        authority: z.string().trim().max(160),
        expiresAt: z.string().refine(value => !Number.isNaN(new Date(value).getTime()), "Provide a valid expiry date."),
      })).mutation(({ ctx, input }) => addProfileCertification(ctx.user.id, { ...input, expiresAt: new Date(input.expiresAt) })),
      deleteCertification: protectedProcedure.input(z.object({ certificationId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteProfileCertification(ctx.user.id, input.certificationId)),
      clockIn: protectedProcedure.mutation(({ ctx }) => clockInProfile(ctx.user.id)),
      clockOut: protectedProcedure.mutation(({ ctx }) => clockOutProfile(ctx.user.id)),
    }),
    academy: router({
      dashboard: protectedProcedure.query(({ ctx }) => getAcademyDashboard(ctx.user.id)),
      course: protectedProcedure.input(z.object({ courseId: z.number().int().positive() })).query(({ ctx, input }) => getAcademyCourseDetail(ctx.user.id, input.courseId)),
      completeLesson: protectedProcedure.input(z.object({ lessonId: z.number().int().positive() })).mutation(({ ctx, input }) => completeAcademyLesson(ctx.user.id, input.lessonId)),
      submitQuiz: protectedProcedure.input(z.object({ lessonId: z.number().int().positive(), answers: z.record(z.string(), z.number().int().nonnegative()) })).mutation(({ ctx, input }) => submitAcademyQuiz(ctx.user.id, input.lessonId, Object.fromEntries(Object.entries(input.answers).map(([id, answer]) => [Number(id), answer])))),
      managerOverview: managerProcedure.query(() => getAcademyManagerOverview()),
      reminderSchedule: managerProcedure.query(async () => (await getAcademyReminderSchedule()) ?? null),
      runRemindersNow: managerProcedure.mutation(() => createAcademyLearningReminders(`manual-${Date.now()}`)),
      configureDailyReminders: managerProcedure.input(z.object({ cron: digestCron })).mutation(async ({ ctx, input }) => {
        if (process.env.NODE_ENV !== "production") return { requiresDeployment: true, message: "Publish this app before activating Academy reminders." };
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; const existing = await getAcademyReminderSchedule(); let taskUid: string; let nextExecutionAt: string | null | undefined;
        if (existing?.scheduleCronTaskUid) { const updated = await updateHeartbeatJob(existing.scheduleCronTaskUid, { cron: input.cron, enable: true }, sessionToken); taskUid = existing.scheduleCronTaskUid; nextExecutionAt = updated.nextExecutionAt; }
        else { const created = await createHeartbeatJob({ name: "fireguard-daily-academy-reminder", cron: input.cron, path: "/api/scheduled/academy-reminders", description: "Daily FireGuard Academy learning reminder" }, sessionToken); taskUid = created.taskUid; nextExecutionAt = created.nextExecutionAt; }
        await saveAcademyReminderSchedule({ cron: input.cron, taskUid, createdByUserId: ctx.user.id }); return { requiresDeployment: false, nextExecutionAt: nextExecutionAt ?? null };
      }),
    }),
    workOrders: router({
      start: fieldProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => updateWorkOrderStatus(input.id, "in_progress", ctx.user.id)),
      submitForReview: fieldProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => updateWorkOrderStatus(input.id, "awaiting_review", ctx.user.id)),
      approve: reviewProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => updateWorkOrderStatus(input.id, "complete", ctx.user.id)),
    }),
    site: router({
      listWithLocations: protectedProcedure.query(() => listSitesWithLocations()),
      get: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ input }) => getSiteLocationDetail(input.siteId)),
      setLocationFromGPS: locationCaptureProcedure.input(z.object({ siteId: z.number().int().positive(), latitude: z.number(), longitude: z.number(), accuracyMeters: z.number().nonnegative() })).mutation(({ ctx, input }) => setSiteLocationFromGps(input.siteId, ctx.user.id, input)),
      setLocationManual: managerProcedure.input(z.object({ siteId: z.number().int().positive(), latitude: z.number(), longitude: z.number() })).mutation(({ ctx, input }) => setSiteLocationManual(input.siteId, ctx.user.id, input)),
      geocodeAddress: locationCaptureProcedure.input(z.object({ siteId: z.number().int().positive() })).mutation(({ ctx, input }) => geocodeSiteAddress(input.siteId, ctx.user.id)),
    }),
    compliance: router({
      detail: protectedProcedure.input(z.object({ workOrderId: z.number().int().positive() })).query(({ input }) => getServiceComplianceDetail(input.workOrderId)),
      updateChecklist: fieldProcedure.input(z.object({ workOrderId: z.number().int().positive(), unitId: z.number().int().positive(), confirmedType: z.string().max(64).optional(), confirmedCapacityKg: z.string().max(16).optional(), confirmedClassification: z.string().max(64).optional(), specificationMismatch: z.boolean(), gaugePressureOk: z.boolean(), sealIntact: z.boolean(), pinPresent: z.boolean(), hoseNozzleOk: z.boolean(), mountingOk: z.boolean(), weightOk: z.boolean(), tagAttached: z.boolean(), notes: z.string().max(4000).optional(), completed: z.boolean() })).mutation(({ ctx, input }) => { const { workOrderId, unitId, ...values } = input; return updateServiceChecklist(workOrderId, unitId, ctx.user.id, values); }),
      uploadEvidence: fieldProcedure.input(z.object({ workOrderId: z.number().int().positive(), unitId: z.number().int().positive(), phase: z.enum(["before", "after"]), originalName: z.string().min(1).max(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataBase64: z.string().min(16).max(10_000_000) })).mutation(({ ctx, input }) => { const { workOrderId, unitId, ...values } = input; return uploadServiceEvidence(workOrderId, unitId, ctx.user.id, values); }),
      flagEvidence: reviewProcedure.input(z.object({ evidenceId: z.number().int().positive(), reason: z.string().min(3).max(2000) })).mutation(({ ctx, input }) => flagServiceEvidence(input.evidenceId, ctx.user.id, input.reason)),
      changeStatus: fieldProcedure.input(z.object({ workOrderId: z.number().int().positive(), status: z.enum(["in_progress", "awaiting_review", "blocked"]), comments: z.string().max(5000).optional() })).mutation(({ ctx, input }) => changeServiceWorkStatus(input.workOrderId, ctx.user.id, input.status, input.comments)),
      review: reviewProcedure.input(z.object({ workOrderId: z.number().int().positive(), decision: z.enum(["approved", "flagged"]), note: z.string().min(3).max(5000) })).mutation(({ ctx, input }) => reviewServiceWork(input.workOrderId, ctx.user.id, input.decision, input.note)),
      issueCertificate: managerProcedure.input(z.object({ workOrderId: z.number().int().positive(), expiresAt: z.coerce.date() })).mutation(({ ctx, input }) => issueServiceCertificate(input.workOrderId, ctx.user.id, input.expiresAt)),
    }),
    exceptions: router({
      acknowledge: managerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => acknowledgeException(input.id, ctx.user.id)),
    }),
    notifications: router({
      list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
      markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markNotificationRead(input.id)),
      runDigestNow: managerProcedure.mutation(() => createExceptionDigest(`manual-${Date.now()}`)),
      schedule: managerProcedure.query(async () => (await getDigestSchedule()) ?? null),
      configureDailyDigest: managerProcedure.input(z.object({ cron: digestCron })).mutation(async ({ ctx, input }) => {
        if (process.env.NODE_ENV !== "production") return { requiresDeployment: true, message: "Publish this app before activating its scheduled digest." };
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        const existing = await getDigestSchedule();
        let taskUid: string;
        let nextExecutionAt: string | null | undefined;
        if (existing?.scheduleCronTaskUid) {
          const updatedJob = await updateHeartbeatJob(existing.scheduleCronTaskUid, { cron: input.cron, enable: true }, sessionToken);
          taskUid = existing.scheduleCronTaskUid;
          nextExecutionAt = updatedJob.nextExecutionAt;
        } else {
          const createdJob = await createHeartbeatJob({ name: "fireguard-daily-exception-digest", cron: input.cron, path: "/api/scheduled/exception-digest", description: "Daily FireGuard exception digest" }, sessionToken);
          taskUid = createdJob.taskUid;
          nextExecutionAt = createdJob.nextExecutionAt;
        }
        await saveDigestSchedule({ cron: input.cron, taskUid, createdByUserId: ctx.user.id });
        return { requiresDeployment: false, nextExecutionAt: nextExecutionAt ?? null };
      }),
    }),
    chat: router({
      inbox: protectedProcedure.query(({ ctx }) => getChatInbox(ctx.user.id)),
      conversation: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ ctx, input }) => getChatConversation(ctx.user.id, input.conversationId)),
      createDirect: protectedProcedure.input(z.object({ recipientUserId: z.number().int().positive() })).mutation(({ ctx, input }) => createDirectChat(ctx.user.id, input.recipientUserId)),
      createGroup: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(120), memberUserIds: z.array(z.number().int().positive()).max(24) })).mutation(({ ctx, input }) => createGroupChat(ctx.user.id, input)),
      createTemporaryGroup: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(120), contextLabel: z.string().trim().min(2).max(160), clientId: z.number().int().positive().nullable().optional(), durationHours: z.number().int().min(1).max(168), memberUserIds: z.array(z.number().int().positive()).min(1).max(24) })).mutation(({ ctx, input }) => createTemporaryGroupChat(ctx.user.id, input)),
      extendTemporaryThread: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), additionalHours: z.number().int().min(1).max(168) })).mutation(({ ctx, input }) => extendTemporaryThread(ctx.user.id, input.conversationId, input.additionalHours)),
      archiveTemporaryThread: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).mutation(({ ctx, input }) => archiveTemporaryThread(ctx.user.id, input.conversationId)),
      addMembers: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), memberUserIds: z.array(z.number().int().positive()).min(1).max(24) })).mutation(({ ctx, input }) => addChatGroupMembers(ctx.user.id, input.conversationId, input.memberUserIds)),
      send: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), body: z.string().trim().min(1).max(5000) })).mutation(({ ctx, input }) => sendChatMessage(ctx.user.id, input.conversationId, input.body)),
      markRead: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).mutation(({ ctx, input }) => markChatRead(ctx.user.id, input.conversationId)),
      toggleReaction: protectedProcedure.input(z.object({ messageId: z.number().int().positive(), emoji: z.string().trim().min(1).max(20) })).mutation(({ ctx, input }) => toggleChatReaction(ctx.user.id, input.messageId, input.emoji)),
      toggleInboxControl: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), action: z.enum(["pin", "archive", "mute"]) })).mutation(({ ctx, input }) => toggleChatInboxControl(ctx.user.id, input.conversationId, input.action)),
    }),
    reports: router({
      generate: managerProcedure.input(z.object({ type: z.enum(["readiness", "service", "exceptions"]) })).mutation(({ ctx, input }) => generateReportCsv(input.type, ctx.user.id)),
    }),
  }),
});

function roleAccountName(role: (typeof legacyPinRoles)[number]) { return `FireGuard ${role[0].toUpperCase()}${role.slice(1)}`; }

export type AppRouter = typeof appRouter;
