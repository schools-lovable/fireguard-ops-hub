/** FireGuard data access: live database queries are seeded once with labeled demonstration records for safe end-to-end workflow testing. */
import { and, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import { randomBytes, scryptSync } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  academyBadges,
  academyCourseProgress,
  academyCourses,
  academyFlashcards,
  academyLessonProgress,
  academyLessons,
  academyQuizAttempts,
  academyQuizQuestions,
  academyReminderSchedules,
  academyUserBadges,
  chatConversationMembers,
  chatConversations,
  chatMessageReactions,
  chatMessages,
  clients,
  employeeProfiles,
  extinguisherUnits,
  exceptions,
  type InsertUser,
  notificationSchedules,
  notifications,
  presenceAlertPreferences,
  profileAccessAudits,
  profileCertifications,
  profilePreferences,
  reportExports,
  serviceCertificates,
  serviceChecklistItems,
  serviceEvidence,
  serviceWorkHistory,
  siteLocationHistory,
  sites,
  temporaryThreadArchiveSchedules,
  timeEntries,
  users,
  workOrders,
} from "../drizzle/schema";
import { buildCsv } from "./exportCsv";
import { buildExceptionDigestCopy, exceptionDigestKey } from "./fireguardRules";
import { calculateProgress, gradeQuiz } from "./academyRules";
import { canonicalDirectKey, compareChatInbox, isMuted } from "./chatRules";
import { isRecentlyActive, managerWantsPresenceAlert, presenceCutoff } from "./presence";
import { profileRoleTitle } from "./profileRules";
import { evaluateServiceReadiness } from "./serviceReadiness";
import { storagePut } from "./storage";
import { canControlTemporaryThread, extendedTemporaryThreadExpiry, isTemporaryThreadArchived, temporaryThreadConversationValues } from "./temporaryThreadRules";
import { makeRequest, type GeocodingResult } from "./_core/map";
import { assertValidCoordinates, coordinateQualityNotice, type LocationSource } from "./siteLocationRules";
import { kigaliDemoClients, kigaliDemoSites } from "./kigaliDemoData";
import { buildIllustrativeSiteDrilldown } from "./siteDrilldownDemo";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const database = await getDb();
  if (!database) throw new Error("FireGuard data service is unavailable");
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await database.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

/** Records authenticated shell activity, captures the current route, and sends opted-in arrival alerts when a user returns after inactivity. */
export async function touchUserPresence(userId: number, currentRoute: string) {
  const database = await requireDb();
  const now = new Date();
  const prior = (await database.select({ name: users.name, role: users.role, lastActiveAt: users.lastActiveAt }).from(users).where(eq(users.id, userId)).limit(1))[0];
  const cameOnline = !prior || !isRecentlyActive(prior.lastActiveAt, now);
  await database.update(users).set({ lastActiveAt: now, currentRoute }).where(eq(users.id, userId));
  if (!cameOnline || !prior) return;

  const preferences = await database.select().from(presenceAlertPreferences);
  const recipientIds = preferences.filter(preference => managerWantsPresenceAlert(prior.role, preference)).map(preference => preference.managerUserId);
  const presenceBucket = Math.floor(now.getTime() / (5 * 60 * 1000));
  await Promise.all(recipientIds.map(async recipientUserId => {
    await database.insert(notifications).values({
      recipientUserId,
      dedupeKey: `presence-${recipientUserId}-${userId}-${presenceBucket}`,
      kind: "presence",
      priority: "low",
      title: `${prior.name || "An operator"} is online`,
      body: `${prior.role === "field" ? "Field team" : "Reviewer"} activity is now visible in FireGuard at ${currentRoute}.`,
      href: "/team",
    }).onDuplicateKeyUpdate({ set: { body: `${prior.role === "field" ? "Field team" : "Reviewer"} activity is now visible in FireGuard at ${currentRoute}.` } });
  }));
}

/** Returns the active FireGuard roster without exposing email addresses or authentication identifiers. */
export async function getActiveUsers() {
  const database = await requireDb();
  return database.select({ id: users.id, name: users.name, role: users.role, currentRoute: users.currentRoute, lastActiveAt: users.lastActiveAt })
    .from(users)
    .where(gte(users.lastActiveAt, presenceCutoff()))
    .orderBy(desc(users.lastActiveAt))
    .limit(8);
}

/** Supervisor roster shows every known operator with their current route and live/away status. */
export async function getTeamRoster() {
  const database = await requireDb();
  const roster = await database.select({ id: users.id, name: users.name, role: users.role, currentRoute: users.currentRoute, lastActiveAt: users.lastActiveAt }).from(users).orderBy(desc(users.lastActiveAt));
  return roster.map(operator => ({ ...operator, isActive: isRecentlyActive(operator.lastActiveAt) }));
}

export async function getPresenceAlertPreferences(managerUserId: number) {
  const database = await requireDb();
  const preference = (await database.select().from(presenceAlertPreferences).where(eq(presenceAlertPreferences.managerUserId, managerUserId)).limit(1))[0];
  return preference ?? { alertFieldTeam: false, alertReviewers: false };
}

export async function updatePresenceAlertPreferences(managerUserId: number, input: { alertFieldTeam: boolean; alertReviewers: boolean }) {
  const database = await requireDb();
  await database.insert(presenceAlertPreferences).values({ managerUserId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getPresenceAlertPreferences(managerUserId);
}

const dateOffset = (days: number, hour = 9) => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(hour, 0, 0, 0);
  return value;
};

/** Inserts named demonstration records once. Each row is marked isDemo=true so real operations remain distinguishable. */
export async function ensureDemoData() {
  const database = await requireDb();
  const existing = await database.select({ id: clients.id }).from(clients).where(eq(clients.isDemo, true)).limit(1);
  if (existing.length > 0) return;

  await database.insert(clients).values([
    { name: "Riverside House", portfolioOwnerName: "Jordan Price", readinessStatus: "review", isDemo: true },
    { name: "Northline Studios", portfolioOwnerName: "Kim Murray", readinessStatus: "ready", isDemo: true },
    { name: "Southbank Collective", portfolioOwnerName: "Amir Green", readinessStatus: "risk", isDemo: true },
    { name: "Harbour Point", portfolioOwnerName: "Jordan Price", readinessStatus: "ready", isDemo: true },
    { name: "Eastgate Developments", portfolioOwnerName: "Kim Murray", readinessStatus: "review", isDemo: true },
  ]);

  const demoClients = await database.select().from(clients).where(eq(clients.isDemo, true));
  const clientId = new Map(demoClients.map(client => [client.name, client.id]));
  const requiredClient = (name: string) => {
    const id = clientId.get(name);
    if (!id) throw new Error(`Demo client ${name} was not created`);
    return id;
  };

  await database.insert(sites).values([
    { clientId: requiredClient("Riverside House"), name: "Riverside House · East Wing", address: "18 Riverside Walk", readinessStatus: "review", nextInspectionAt: dateOffset(1, 9), isDemo: true },
    { clientId: requiredClient("Northline Studios"), name: "Northline Studios · Main Campus", address: "11 Northline Lane", readinessStatus: "ready", nextInspectionAt: dateOffset(3, 10), isDemo: true },
    { clientId: requiredClient("Southbank Collective"), name: "Southbank Collective · Block C", address: "4 Southbank Avenue", readinessStatus: "risk", nextInspectionAt: dateOffset(2, 8), isDemo: true },
    { clientId: requiredClient("Harbour Point"), name: "Harbour Point · Floor 3", address: "22 Harbour Street", readinessStatus: "ready", nextInspectionAt: dateOffset(5, 11), isDemo: true },
    { clientId: requiredClient("Eastgate Developments"), name: "Eastgate Developments · Dock 2", address: "68 Eastgate Road", readinessStatus: "review", nextInspectionAt: dateOffset(6, 13), isDemo: true },
  ]);

  const demoSites = await database.select().from(sites).where(eq(sites.isDemo, true));
  const siteId = new Map(demoSites.map(site => [site.name, site.id]));
  const requiredSite = (name: string) => {
    const id = siteId.get(name);
    if (!id) throw new Error(`Demo site ${name} was not created`);
    return id;
  };

  await database.insert(workOrders).values([
    { siteId: requiredSite("Riverside House · East Wing"), title: "Annual alarm system test", workType: "Alarm system", status: "scheduled", evidenceProgress: 86, scheduledFor: dateOffset(1, 9), dueAt: dateOffset(2, 17), isDemo: true },
    { siteId: requiredSite("Harbour Point · Floor 3"), title: "Emergency lighting inspection", workType: "Emergency lighting", status: "in_progress", evidenceProgress: 42, scheduledFor: dateOffset(2, 10), dueAt: dateOffset(3, 17), isDemo: true },
    { siteId: requiredSite("Southbank Collective · Block C"), title: "Extinguisher asset verification", workType: "Extinguishers", status: "blocked", evidenceProgress: 18, scheduledFor: dateOffset(3, 9), dueAt: dateOffset(3, 17), isDemo: true },
    { siteId: requiredSite("Eastgate Developments · Dock 2"), title: "Sprinkler valve maintenance", workType: "Sprinkler systems", status: "scheduled", evidenceProgress: 58, scheduledFor: dateOffset(4, 13), dueAt: dateOffset(5, 17), isDemo: true },
    { siteId: requiredSite("Northline Studios · Main Campus"), title: "Quarterly evidence pack", workType: "Evidence review", status: "awaiting_review", evidenceProgress: 100, scheduledFor: dateOffset(-1, 14), dueAt: dateOffset(1, 17), isDemo: true },
  ]);

  const demoWork = await database.select().from(workOrders).where(eq(workOrders.isDemo, true));
  const workId = new Map(demoWork.map(work => [work.title, work.id]));
  await database.insert(exceptions).values([
    { siteId: requiredSite("Southbank Collective · Block C"), workOrderId: workId.get("Extinguisher asset verification"), title: "Missing service evidence for device group B", detail: "Two detector tests were completed without the required sign-off photographs. Assign a reviewer before the inspection window closes.", severity: "high", status: "open", dueAt: dateOffset(-1, 17), isDemo: true },
    { siteId: requiredSite("Riverside House · East Wing"), workOrderId: workId.get("Annual alarm system test"), title: "Plant-room access window expired", detail: "The confirmed access window for the Riverside annual test has passed. Rebook the visit with the site contact.", severity: "medium", status: "open", dueAt: dateOffset(0, 17), isDemo: true },
    { siteId: requiredSite("Harbour Point · Floor 3"), workOrderId: workId.get("Emergency lighting inspection"), title: "Asset register has 3 unmatched serials", detail: "Extinguisher serial numbers need confirmation against the latest field inventory.", severity: "medium", status: "acknowledged", dueAt: dateOffset(2, 17), isDemo: true },
  ]);
}

/** Extends, rather than replaces, sample records. Every added row remains explicitly marked isDemo=true. */
async function ensureKigaliDemoData() {
  const database = await requireDb();
  const existingClients = new Set((await database.select({ name: clients.name }).from(clients).where(eq(clients.isDemo, true))).map(client => client.name));
  const missingClients = kigaliDemoClients.filter(client => !existingClients.has(client.name));
  if (missingClients.length) await database.insert(clients).values(missingClients.map(client => ({ ...client, isDemo: true })));
  const demoClients = await database.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.isDemo, true));
  const clientIdByName = new Map(demoClients.map(client => [client.name, client.id]));
  const existingSites = new Set((await database.select({ name: sites.name }).from(sites).where(eq(sites.isDemo, true))).map(site => site.name));
  const missingSites = kigaliDemoSites.filter(([, name]) => !existingSites.has(name));
  if (missingSites.length) await database.insert(sites).values(missingSites.map(([clientName, name, address, readinessStatus, latitude, longitude, , , , , inspectionOffset]) => ({ clientId: clientIdByName.get(clientName)!, name, address, readinessStatus, latitude: String(latitude), longitude: String(longitude), locationSource: "geocoded" as const, locationCapturedAt: new Date(), nextInspectionAt: dateOffset(inspectionOffset, 9), isDemo: true })));
  const demoSites = await database.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.isDemo, true)); const siteIdByName = new Map(demoSites.map(site => [site.name, site.id]));
  const existingWorkTitles = new Set((await database.select({ title: workOrders.title }).from(workOrders).where(eq(workOrders.isDemo, true))).map(work => work.title));
  const missingWork = kigaliDemoSites.filter(site => !existingWorkTitles.has(site[6]));
  if (missingWork.length) await database.insert(workOrders).values(missingWork.map(site => ({ siteId: siteIdByName.get(site[1])!, title: site[6], workType: site[7], status: site[8], evidenceProgress: site[9], scheduledFor: dateOffset(site[10], 10), dueAt: dateOffset(site[11], 17), isDemo: true })));
  const demoWork = await database.select({ id: workOrders.id, title: workOrders.title }).from(workOrders).where(eq(workOrders.isDemo, true)); const workIdByTitle = new Map(demoWork.map(work => [work.title, work.id]));
  const existingExceptionTitles = new Set((await database.select({ title: exceptions.title }).from(exceptions).where(eq(exceptions.isDemo, true))).map(item => item.title));
  const missingExceptions = kigaliDemoSites.filter(site => site[12] && !existingExceptionTitles.has(site[12]));
  if (missingExceptions.length) await database.insert(exceptions).values(missingExceptions.map(site => ({ siteId: siteIdByName.get(site[1])!, workOrderId: workIdByTitle.get(site[6]), title: site[12]!, detail: "Illustrative Kigali demonstration exception for training and operational planning only.", severity: site[13]!, status: "open" as const, dueAt: dateOffset(site[11], 17), isDemo: true })));
}

async function getJoinedOperationalData() {
  await ensureDemoData();
  await ensureKigaliDemoData();
  const database = await requireDb();
  const [clientRows, siteRows, workRows, exceptionRows] = await Promise.all([
    database.select().from(clients).orderBy(clients.name),
    database.select().from(sites).orderBy(sites.name),
    database.select().from(workOrders).orderBy(workOrders.scheduledFor),
    database.select().from(exceptions).orderBy(desc(exceptions.createdAt)),
  ]);
  const clientById = new Map(clientRows.map(client => [client.id, client]));
  const siteById = new Map(siteRows.map(site => [site.id, site]));
  return { clientRows, siteRows, workRows, exceptionRows, clientById, siteById };
}

export async function getWorkspaceSnapshot() {
  const { clientRows, siteRows, workRows, exceptionRows, clientById, siteById } = await getJoinedOperationalData();
  const workWithContext = workRows.map(work => {
    const site = siteById.get(work.siteId);
    return { ...work, siteName: site?.name ?? "Unknown site", clientName: site ? clientById.get(site.clientId)?.name ?? "Unknown client" : "Unknown client" };
  });
  const exceptionWithContext = exceptionRows.map(item => {
    const site = siteById.get(item.siteId);
    return { ...item, siteName: site?.name ?? "Unknown site", clientName: site ? clientById.get(site.clientId)?.name ?? "Unknown client" : "Unknown client" };
  });
  const now = new Date();
  const readySiteCount = siteRows.filter(site => site.readinessStatus === "ready").length;
  const openExceptionCount = exceptionRows.filter(item => item.status !== "resolved").length;
  const overdueExceptionCount = exceptionRows.filter(item => item.status !== "resolved" && item.dueAt && item.dueAt < now).length;
  return {
    clients: clientRows.map(client => ({ ...client, siteCount: siteRows.filter(site => site.clientId === client.id).length })),
    sites: siteRows,
    workOrders: workWithContext,
    exceptions: exceptionWithContext,
    metrics: { clientCount: clientRows.length, siteCount: siteRows.length, readySiteCount, openExceptionCount, overdueExceptionCount, completedWorkOrders: workRows.filter(work => work.status === "complete").length },
    isDemo: clientRows.some(client => client.isDemo),
  };
}

/** Keeps the labelled demonstration portfolio explorable on the Client Map without affecting real client records. */
async function ensureDemoSiteLocations() {
  const database = await requireDb();
  const demoSites = await database.select({ id: sites.id, name: sites.name, latitude: sites.latitude }).from(sites).where(eq(sites.isDemo, true));
  const sampleLocations: Record<string, [number, number]> = { "Riverside House · East Wing": [-1.9441, 30.0619], "Northline Studios · Main Campus": [-1.9517, 30.0588], "Southbank Collective · Block C": [-1.9309, 30.0736], "Harbour Point · Floor 3": [-1.9675, 30.0942], "Eastgate Developments · Dock 2": [-1.9206, 30.0597] };
  await Promise.all(demoSites.filter(site => !site.latitude && sampleLocations[site.name]).map(site => { const [latitude, longitude] = sampleLocations[site.name]; return database.update(sites).set({ latitude: String(latitude), longitude: String(longitude), locationSource: "geocoded", locationCapturedAt: new Date() }).where(eq(sites.id, site.id)); }));
}

export async function listSitesWithLocations() {
  await ensureDemoData(); await ensureKigaliDemoData(); await ensureDemoSiteLocations();
  const database = await requireDb();
  const rows = await database.select({ id: sites.id, clientId: sites.clientId, clientName: clients.name, name: sites.name, address: sites.address, readinessStatus: sites.readinessStatus, nextInspectionAt: sites.nextInspectionAt, latitude: sites.latitude, longitude: sites.longitude, locationSource: sites.locationSource, locationCapturedAt: sites.locationCapturedAt, locationCapturedBy: sites.locationCapturedBy, locationAccuracyMeters: sites.locationAccuracyMeters, isDemo: sites.isDemo }).from(sites).innerJoin(clients, eq(sites.clientId, clients.id)).orderBy(sites.name);
  return rows.map(site => ({ ...site, latitude: site.latitude === null ? null : Number(site.latitude), longitude: site.longitude === null ? null : Number(site.longitude), locationAccuracyMeters: site.locationAccuracyMeters === null ? null : Number(site.locationAccuracyMeters) }));
}

export async function getSiteLocationDetail(siteId: number) {
  await ensureDemoData(); await ensureKigaliDemoData();
  const database = await requireDb();
  const site = (await database.select({ id: sites.id, clientId: sites.clientId, clientName: clients.name, name: sites.name, address: sites.address, readinessStatus: sites.readinessStatus, nextInspectionAt: sites.nextInspectionAt, latitude: sites.latitude, longitude: sites.longitude, locationSource: sites.locationSource, locationCapturedAt: sites.locationCapturedAt, locationCapturedBy: sites.locationCapturedBy, locationAccuracyMeters: sites.locationAccuracyMeters, isDemo: sites.isDemo }).from(sites).innerJoin(clients, eq(sites.clientId, clients.id)).where(eq(sites.id, siteId)).limit(1))[0];
  if (!site) throw new Error("Site not found");
  const [history, siteWorkOrders] = await Promise.all([database.select().from(siteLocationHistory).where(eq(siteLocationHistory.siteId, siteId)).orderBy(desc(siteLocationHistory.capturedAt)).limit(8), database.select({ id: workOrders.id, title: workOrders.title, workType: workOrders.workType, status: workOrders.status, evidenceProgress: workOrders.evidenceProgress, scheduledFor: workOrders.scheduledFor, dueAt: workOrders.dueAt }).from(workOrders).where(eq(workOrders.siteId, siteId)).orderBy(desc(workOrders.scheduledFor))]);
  const illustrative = buildIllustrativeSiteDrilldown({ id: site.id, name: site.name, clientName: site.clientName, readinessStatus: site.readinessStatus, isDemo: site.isDemo }, siteWorkOrders);
  return { ...site, latitude: site.latitude === null ? null : Number(site.latitude), longitude: site.longitude === null ? null : Number(site.longitude), locationAccuracyMeters: site.locationAccuracyMeters === null ? null : Number(site.locationAccuracyMeters), history, ...illustrative };
}

async function saveSiteLocation(siteId: number, actorUserId: number, input: { latitude: number; longitude: number; source: LocationSource; accuracyMeters?: number | null }) {
  assertValidCoordinates(input.latitude, input.longitude, input.accuracyMeters);
  const database = await requireDb(); const prior = (await database.select().from(sites).where(eq(sites.id, siteId)).limit(1))[0]; if (!prior) throw new Error("Site not found");
  if (input.source === "gps_capture" && prior.locationSource === "gps_capture" && prior.locationCapturedAt && Date.now() - prior.locationCapturedAt.getTime() < 10_000) throw new Error("This site was just captured. Wait a few seconds before replacing its GPS pin.");
  const now = new Date(); const latitude = String(input.latitude); const longitude = String(input.longitude); const accuracyMeters = input.accuracyMeters === null || input.accuracyMeters === undefined ? null : String(input.accuracyMeters);
  await database.update(sites).set({ latitude, longitude, locationSource: input.source, locationCapturedBy: String(actorUserId), locationCapturedAt: now, locationAccuracyMeters: accuracyMeters }).where(eq(sites.id, siteId));
  await database.insert(siteLocationHistory).values({ siteId, previousLatitude: prior.latitude, previousLongitude: prior.longitude, latitude, longitude, source: input.source, accuracyMeters, capturedByUserId: actorUserId, capturedAt: now });
  return { site: await getSiteLocationDetail(siteId), notices: coordinateQualityNotice(input.latitude, input.longitude, input.accuracyMeters) };
}

export function setSiteLocationFromGps(siteId: number, actorUserId: number, input: { latitude: number; longitude: number; accuracyMeters: number }) { return saveSiteLocation(siteId, actorUserId, { ...input, source: "gps_capture" }); }
export function setSiteLocationManual(siteId: number, actorUserId: number, input: { latitude: number; longitude: number }) { return saveSiteLocation(siteId, actorUserId, { ...input, source: "manual" }); }
export async function geocodeSiteAddress(siteId: number, actorUserId: number) {
  const database = await requireDb(); const site = (await database.select({ address: sites.address }).from(sites).where(eq(sites.id, siteId)).limit(1))[0]; if (!site) throw new Error("Site not found");
  const response = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address: site.address }); const match = response.results[0]; if (!match || response.status !== "OK") throw new Error("No map pin could be found for this site address. Capture GPS or enter coordinates manually.");
  return saveSiteLocation(siteId, actorUserId, { latitude: match.geometry.location.lat, longitude: match.geometry.location.lng, source: "geocoded" });
}

export async function updateWorkOrderStatus(workOrderId: number, status: "in_progress" | "awaiting_review" | "complete", actorUserId: number) {
  const database = await requireDb();
  const patch = status === "in_progress" ? { status, assignedUserId: actorUserId } : status === "awaiting_review" ? { status, evidenceProgress: 100 } : { status, evidenceProgress: 100 };
  await database.update(workOrders).set(patch).where(eq(workOrders.id, workOrderId));
  return getWorkspaceSnapshot();
}

export async function acknowledgeException(exceptionId: number, ownerUserId: number) {
  const database = await requireDb();
  await database.update(exceptions).set({ status: "acknowledged", ownerUserId }).where(eq(exceptions.id, exceptionId));
  await database.insert(notifications).values({ sourceExceptionId: exceptionId, recipientUserId: null, kind: "assignment", priority: "medium", title: "Exception assigned", body: "An exception now has an accountable FireGuard owner.", href: "/exceptions" });
  return getWorkspaceSnapshot();
}

export async function listNotifications(userId: number) {
  const database = await requireDb();
  return database.select().from(notifications).where(or(isNull(notifications.recipientUserId), eq(notifications.recipientUserId, userId))).orderBy(desc(notifications.createdAt)).limit(24);
}

export async function markNotificationRead(notificationId: number) {
  const database = await requireDb();
  await database.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function createExceptionDigest(scope = "daily") {
  const database = await requireDb();
  await ensureDemoData();
  const now = new Date();
  const openItems = await database.select().from(exceptions).where(or(eq(exceptions.status, "open"), eq(exceptions.status, "acknowledged")));
  const overdueItems = openItems.filter(item => item.dueAt && item.dueAt <= now);
  const overdueCount = overdueItems.length;
  const digest = buildExceptionDigestCopy(openItems.length, overdueCount);
  const dedupeKey = exceptionDigestKey(now, scope);
  const previous = await database.select({ id: notifications.id }).from(notifications).where(eq(notifications.dedupeKey, dedupeKey)).limit(1);
  let created = false;
  if (previous.length === 0) {
    await database.insert(notifications).values({ dedupeKey, kind: "digest", priority: "medium", title: digest.title, body: digest.body, href: "/exceptions" });
    created = true;
  }
  let overdueCreated = 0;
  for (const item of overdueItems) {
    const overdueKey = `exception-overdue-${item.id}-${now.toISOString().slice(0, 10)}`;
    const priorOverdue = await database.select({ id: notifications.id }).from(notifications).where(eq(notifications.dedupeKey, overdueKey)).limit(1);
    if (priorOverdue.length === 0) {
      await database.insert(notifications).values({ dedupeKey: overdueKey, sourceExceptionId: item.id, kind: "overdue", priority: "high", title: `Overdue exception: ${item.title}`, body: "This FireGuard exception remains unresolved after its due time. Review and assign an accountable owner.", href: "/exceptions" });
      overdueCreated += 1;
    }
  }
  return { created, overdueCreated, openCount: openItems.length, overdueCount };
}

export async function getScheduleByTaskUid(taskUid: string) {
  const database = await requireDb();
  const rows = await database.select().from(notificationSchedules).where(eq(notificationSchedules.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function getDigestSchedule() {
  const database = await requireDb();
  const rows = await database.select().from(notificationSchedules).where(eq(notificationSchedules.name, "Daily exception digest")).limit(1);
  return rows[0];
}

export async function saveDigestSchedule(input: { cron: string; taskUid: string; createdByUserId: number }) {
  const database = await requireDb();
  const existing = await getDigestSchedule();
  if (existing) {
    await database.update(notificationSchedules).set({ cron: input.cron, scheduleCronTaskUid: input.taskUid, enabled: true }).where(eq(notificationSchedules.id, existing.id));
    return existing.id;
  }
  const inserted = await database.insert(notificationSchedules).values({ name: "Daily exception digest", cron: input.cron, scheduleCronTaskUid: input.taskUid, enabled: true, createdByUserId: input.createdByUserId });
  return Number(inserted[0].insertId);
}

export async function recordScheduleRun(scheduleId: number) {
  const database = await requireDb();
  await database.update(notificationSchedules).set({ lastRunAt: new Date() }).where(eq(notificationSchedules.id, scheduleId));
}

export async function generateReportCsv(reportType: "readiness" | "service" | "exceptions", userId: number) {
  const snapshot = await getWorkspaceSnapshot();
  let header: string[];
  let rows: unknown[][];
  if (reportType === "readiness") {
    header = ["Client", "Site", "Readiness", "Next inspection"];
    rows = snapshot.sites.map(site => [snapshot.clients.find(client => client.id === site.clientId)?.name, site.name, site.readinessStatus, site.nextInspectionAt?.toISOString()]);
  } else if (reportType === "service") {
    header = ["Work order", "Client", "Site", "Status", "Evidence progress", "Scheduled for"];
    rows = snapshot.workOrders.map(work => [work.title, work.clientName, work.siteName, work.status, `${work.evidenceProgress}%`, work.scheduledFor.toISOString()]);
  } else {
    header = ["Exception", "Client", "Site", "Severity", "Status", "Due at"];
    rows = snapshot.exceptions.map(item => [item.title, item.clientName, item.siteName, item.severity, item.status, item.dueAt?.toISOString()]);
  }
  const csv = buildCsv(header, rows);
  const database = await requireDb();
  await database.insert(reportExports).values({ requestedByUserId: userId, reportType, rowCount: rows.length });
  return { filename: `fireguard-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`, csv, rowCount: rows.length };
}

/** Seeds clearly-labelled replacement Academy content so teams can test the full learning flow before an approved curriculum is supplied. */
export async function ensureAcademyData() {
  const database = await requireDb();
  const existing = await database.select({ id: academyCourses.id }).from(academyCourses).where(eq(academyCourses.isDemo, true)).limit(1);
  if (existing.length) {
    const videoLessons = (await database.select().from(academyLessons)).filter(lesson => lesson.lessonType === "video" && !lesson.videoUrl);
    await Promise.all(videoLessons.map(lesson => database.update(academyLessons).set({ videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }).where(eq(academyLessons.id, lesson.id))));
    return;
  }
  await database.insert(academyCourses).values([
    { title: "Field evidence essentials", slug: "field-evidence-essentials", summary: "Replacement Academy sample: practise a clear evidence capture and handoff routine before a service record is reviewed.", category: "Field practice", level: "foundation", estimatedMinutes: 24, requiredRole: "field", isDemo: true },
    { title: "Exception ownership", slug: "exception-ownership", summary: "Replacement Academy sample: learn how to acknowledge, assign, and follow through on a safety exception.", category: "Operations", level: "foundation", estimatedMinutes: 18, requiredRole: "all", isDemo: true },
    { title: "Review-ready records", slug: "review-ready-records", summary: "Replacement Academy sample: check evidence packs for completeness, traceability, and a decisive review handoff.", category: "Compliance", level: "intermediate", estimatedMinutes: 28, requiredRole: "reviewer", isDemo: true },
  ]);
  const courses = await database.select().from(academyCourses).where(eq(academyCourses.isDemo, true));
  const bySlug = new Map(courses.map(course => [course.slug, course]));
  const field = bySlug.get("field-evidence-essentials")!; const exceptionCourse = bySlug.get("exception-ownership")!; const review = bySlug.get("review-ready-records")!;
  await database.insert(academyLessons).values([
    { courseId: field.id, title: "Briefing: evidence that can be reviewed", lessonType: "video", body: "Demonstration video placeholder: replace this clip with your approved field briefing. Keep the key prompts clear: show the asset, show the result, identify the location, and make the handoff unambiguous.", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", durationMinutes: 6, sortOrder: 1 },
    { courseId: field.id, title: "Evidence capture checklist", lessonType: "reading", body: "Capture a clear view of the asset identifier, the relevant test result, and the location context. Add enough written context that a reviewer can understand the record without a follow-up call.", durationMinutes: 7, sortOrder: 2 },
    { courseId: field.id, title: "Evidence check", lessonType: "quiz", body: "Complete this self-check to confirm the Academy sample workflow.", durationMinutes: 5, sortOrder: 3 },
    { courseId: field.id, title: "Field recall cards", lessonType: "flashcards", body: "Use the cards to rehearse the evidence capture sequence.", durationMinutes: 6, sortOrder: 4 },
    { courseId: exceptionCourse.id, title: "From exception to accountable owner", lessonType: "reading", body: "A useful exception record describes the gap, identifies its operational context, names an accountable owner, and shows the next reasonable action. Keep the status current as information changes.", durationMinutes: 8, sortOrder: 1 },
    { courseId: exceptionCourse.id, title: "Ownership scenario", lessonType: "quiz", body: "Check how you would move an exception toward a clear resolution.", durationMinutes: 5, sortOrder: 2 },
    { courseId: exceptionCourse.id, title: "Exception recall cards", lessonType: "flashcards", body: "Quick prompts for accountable exception handling.", durationMinutes: 5, sortOrder: 3 },
    { courseId: review.id, title: "Video briefing: review posture", lessonType: "video", body: "Demonstration video placeholder: replace this clip with your approved reviewer briefing. Review records for clarity, traceability, and evidence that supports the stated outcome.", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", durationMinutes: 7, sortOrder: 1 },
    { courseId: review.id, title: "Review handoff standard", lessonType: "reading", body: "A review-ready record connects the work completed, the supporting evidence, and the decision made. When information is missing, request a precise follow-up rather than accepting an unclear pack.", durationMinutes: 8, sortOrder: 2 },
    { courseId: review.id, title: "Review readiness check", lessonType: "quiz", body: "Complete the reviewer self-check.", durationMinutes: 6, sortOrder: 3 },
  ]);
  const lessons = await database.select().from(academyLessons); const lesson = (courseId: number, title: string) => lessons.find(item => item.courseId === courseId && item.title === title)!;
  const fieldQuiz = lesson(field.id, "Evidence check"); const exceptionQuiz = lesson(exceptionCourse.id, "Ownership scenario"); const reviewQuiz = lesson(review.id, "Review readiness check");
  await database.insert(academyQuizQuestions).values([
    { lessonId: fieldQuiz.id, prompt: "Which detail most helps a reviewer understand where evidence was captured?", optionsJson: JSON.stringify(["Location context", "A generic filename", "Only the completion date"]), correctOption: 0, explanation: "Location context lets a reviewer connect evidence to the right asset and visit.", sortOrder: 1 },
    { lessonId: fieldQuiz.id, prompt: "What should a written note enable?", optionsJson: JSON.stringify(["A reviewer to understand the record without a follow-up call", "A shorter visit", "A different asset identifier"]), correctOption: 0, explanation: "A clear handoff reduces avoidable clarification loops.", sortOrder: 2 },
    { lessonId: exceptionQuiz.id, prompt: "What is the best next step after an exception is confirmed?", optionsJson: JSON.stringify(["Give it a clear owner and next action", "Leave it without a status", "Delete the record"]), correctOption: 0, explanation: "Ownership and a next action make an exception manageable.", sortOrder: 1 },
    { lessonId: reviewQuiz.id, prompt: "A review-ready record should connect evidence to what?", optionsJson: JSON.stringify(["The work completed and the decision made", "A random future task", "An unrelated site"]), correctOption: 0, explanation: "Traceability connects work, evidence, and review outcome.", sortOrder: 1 },
  ]);
  const fieldCards = lesson(field.id, "Field recall cards"); const exceptionCards = lesson(exceptionCourse.id, "Exception recall cards");
  await database.insert(academyFlashcards).values([
    { lessonId: fieldCards.id, front: "First evidence prompt", back: "Show the asset identifier clearly.", sortOrder: 1 }, { lessonId: fieldCards.id, front: "Second evidence prompt", back: "Show the relevant result and location context.", sortOrder: 2 }, { lessonId: fieldCards.id, front: "Final handoff prompt", back: "Write enough context for review without a follow-up call.", sortOrder: 3 },
    { lessonId: exceptionCards.id, front: "What makes an exception actionable?", back: "A clear gap, an accountable owner, and a practical next action.", sortOrder: 1 }, { lessonId: exceptionCards.id, front: "When should status change?", back: "When the operational understanding or ownership changes.", sortOrder: 2 },
  ]);
  await database.insert(academyBadges).values([
    { badgeKey: "field-evidence", title: "Evidence ready", description: "Completed the field evidence essentials pathway.", courseId: field.id, accent: "mint" }, { badgeKey: "exception-owner", title: "Ownership clear", description: "Completed the exception ownership pathway.", courseId: exceptionCourse.id, accent: "ember" }, { badgeKey: "review-ready", title: "Review ready", description: "Completed the review-ready records pathway.", courseId: review.id, accent: "sky" },
  ]);
}

async function refreshAcademyProgress(userId: number, courseId: number, lastLessonId?: number) {
  const database = await requireDb(); const lessons = await database.select().from(academyLessons).where(eq(academyLessons.courseId, courseId)); const progressRows = await database.select().from(academyLessonProgress).where(eq(academyLessonProgress.userId, userId));
  const completedLessons = progressRows.filter(row => row.isComplete && lessons.some(lesson => lesson.id === row.lessonId)).length; const state = calculateProgress(completedLessons, lessons.length); const now = new Date();
  await database.insert(academyCourseProgress).values({ userId, courseId, ...state, lastLessonId: lastLessonId ?? null, startedAt: state.progressPercent ? now : null, completedAt: state.status === "complete" ? now : null }).onDuplicateKeyUpdate({ set: { ...state, lastLessonId: lastLessonId ?? null, completedAt: state.status === "complete" ? now : null } });
  if (state.status === "complete") { const badge = (await database.select().from(academyBadges).where(eq(academyBadges.courseId, courseId)).limit(1))[0]; if (badge) await database.insert(academyUserBadges).values({ userId, badgeId: badge.id }).onDuplicateKeyUpdate({ set: { badgeId: badge.id } }); }
  return state;
}

export async function getAcademyDashboard(userId: number) {
  await ensureAcademyData(); const database = await requireDb(); const [courses, lessons, courseProgress, lessonProgress, badges, userBadges] = await Promise.all([database.select().from(academyCourses).where(eq(academyCourses.isPublished, true)), database.select().from(academyLessons), database.select().from(academyCourseProgress).where(eq(academyCourseProgress.userId, userId)), database.select().from(academyLessonProgress).where(eq(academyLessonProgress.userId, userId)), database.select().from(academyBadges), database.select().from(academyUserBadges).where(eq(academyUserBadges.userId, userId))]);
  const badgeIds = new Set(userBadges.map(item => item.badgeId));
  return { courses: courses.map(course => { const courseLessons = lessons.filter(item => item.courseId === course.id); const completed = lessonProgress.filter(item => item.isComplete && courseLessons.some(lesson => lesson.id === item.lessonId)).length; const stored = courseProgress.find(item => item.courseId === course.id); const state = stored ?? calculateProgress(completed, courseLessons.length); return { ...course, lessonCount: courseLessons.length, completedLessons: completed, progressPercent: state.progressPercent, status: state.status, badge: badges.find(item => item.courseId === course.id) ?? null, hasBadge: badgeIds.has(badges.find(item => item.courseId === course.id)?.id ?? -1) }; }), badges: badges.filter(badge => badgeIds.has(badge.id)), stats: { completedCourses: courseProgress.filter(item => item.status === "complete").length, activeCourses: courseProgress.filter(item => item.status === "in_progress").length } };
}

export async function getAcademyCourseDetail(userId: number, courseId: number) {
  await ensureAcademyData(); const database = await requireDb(); const course = (await database.select().from(academyCourses).where(eq(academyCourses.id, courseId)).limit(1))[0]; if (!course) throw new Error("Academy course not found"); const lessons = await database.select().from(academyLessons).where(eq(academyLessons.courseId, courseId)); const [questions, flashcards, progress] = await Promise.all([database.select().from(academyQuizQuestions), database.select().from(academyFlashcards), database.select().from(academyLessonProgress).where(eq(academyLessonProgress.userId, userId))]);
  return { course, lessons: lessons.sort((a, b) => a.sortOrder - b.sortOrder).map(lesson => ({ ...lesson, isComplete: progress.find(item => item.lessonId === lesson.id)?.isComplete ?? false, questions: questions.filter(item => item.lessonId === lesson.id).sort((a, b) => a.sortOrder - b.sortOrder).map(question => ({ ...question, options: JSON.parse(question.optionsJson) as string[] })), flashcards: flashcards.filter(item => item.lessonId === lesson.id).sort((a, b) => a.sortOrder - b.sortOrder) })) };
}

export async function completeAcademyLesson(userId: number, lessonId: number) { const database = await requireDb(); const lesson = (await database.select().from(academyLessons).where(eq(academyLessons.id, lessonId)).limit(1))[0]; if (!lesson) throw new Error("Academy lesson not found"); await database.insert(academyLessonProgress).values({ userId, lessonId, isComplete: true, completedAt: new Date() }).onDuplicateKeyUpdate({ set: { isComplete: true, completedAt: new Date() } }); return refreshAcademyProgress(userId, lesson.courseId, lessonId); }

export async function submitAcademyQuiz(userId: number, lessonId: number, answers: Record<number, number>) { const database = await requireDb(); const questions = await database.select().from(academyQuizQuestions).where(eq(academyQuizQuestions.lessonId, lessonId)); const result = gradeQuiz(questions, answers); await database.insert(academyQuizAttempts).values({ userId, lessonId, answersJson: JSON.stringify(answers), ...result }); if (result.isPassed) await completeAcademyLesson(userId, lessonId); return result; }

export async function getAcademyManagerOverview() { await ensureAcademyData(); const database = await requireDb(); const [learners, courses, progress] = await Promise.all([database.select({ id: users.id, name: users.name, role: users.role, lastActiveAt: users.lastActiveAt }).from(users), database.select().from(academyCourses).where(eq(academyCourses.isPublished, true)), database.select().from(academyCourseProgress)]); return { courseCount: courses.length, learners: learners.map(learner => { const records = progress.filter(item => item.userId === learner.id); return { ...learner, completedCourses: records.filter(item => item.status === "complete").length, activeCourses: records.filter(item => item.status === "in_progress").length, averageProgress: records.length ? Math.round(records.reduce((sum, item) => sum + item.progressPercent, 0) / records.length) : 0 }; }) }; }

/** Creates one idempotent in-app prompt for each learner who still has an Academy path to complete. */
export async function createAcademyLearningReminders(scope = "daily") {
  await ensureAcademyData(); const database = await requireDb(); const [learners, courses, progress] = await Promise.all([database.select({ id: users.id, name: users.name }).from(users), database.select().from(academyCourses).where(eq(academyCourses.isPublished, true)), database.select().from(academyCourseProgress)]); const day = new Date().toISOString().slice(0, 10); let created = 0;
  for (const learner of learners) { const completed = progress.filter(item => item.userId === learner.id && item.status === "complete").length; if (completed >= courses.length) continue; const key = `academy-reminder-${scope}-${learner.id}-${day}`; const existing = await database.select({ id: notifications.id }).from(notifications).where(eq(notifications.dedupeKey, key)).limit(1); if (!existing.length) { await database.insert(notifications).values({ recipientUserId: learner.id, dedupeKey: key, kind: "learning", priority: "low", title: "Continue your Academy learning", body: `${learner.name || "A FireGuard learner"}, you have ${courses.length - completed} Academy path${courses.length - completed === 1 ? "" : "s"} ready for your next learning step.`, href: "/academy" }); created += 1; } }
  return { created, learnerCount: learners.length };
}

export async function getAcademyReminderSchedule() { const database = await requireDb(); return (await database.select().from(academyReminderSchedules).where(eq(academyReminderSchedules.name, "Daily Academy learning reminder")).limit(1))[0]; }
export async function getAcademyReminderScheduleByTaskUid(taskUid: string) { const database = await requireDb(); return (await database.select().from(academyReminderSchedules).where(eq(academyReminderSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0]; }
export async function saveAcademyReminderSchedule(input: { cron: string; taskUid: string; createdByUserId: number }) { const database = await requireDb(); const existing = await getAcademyReminderSchedule(); if (existing) { await database.update(academyReminderSchedules).set({ cron: input.cron, scheduleCronTaskUid: input.taskUid, enabled: true }).where(eq(academyReminderSchedules.id, existing.id)); return existing.id; } const created = await database.insert(academyReminderSchedules).values({ name: "Daily Academy learning reminder", cron: input.cron, scheduleCronTaskUid: input.taskUid, enabled: true, createdByUserId: input.createdByUserId }); return Number(created[0].insertId); }
export async function recordAcademyReminderRun(scheduleId: number) { const database = await requireDb(); await database.update(academyReminderSchedules).set({ lastRunAt: new Date() }).where(eq(academyReminderSchedules.id, scheduleId)); }

/** Seeds one clearly labelled asset/checklist example under the existing demo workspace, enabling the imported service workflow to be explored safely. */
export async function ensureComplianceDemoData() {
  await ensureDemoData(); const database = await requireDb();
  const site = (await database.select().from(sites).where(eq(sites.isDemo, true)).limit(1))[0];
  const client = (await database.select().from(clients).where(eq(clients.isDemo, true)).limit(1))[0];
  const workOrder = (await database.select().from(workOrders).where(eq(workOrders.isDemo, true)).limit(1))[0];
  if (!site || !client || !workOrder) return;
  let unit = (await database.select().from(extinguisherUnits).where(eq(extinguisherUnits.siteId, site.id)).limit(1))[0];
  if (!unit) { const result = await database.insert(extinguisherUnits).values({ siteId: site.id, serialNumber: "DEMO-FG-001", extinguisherType: "Stored-pressure water", capacityKg: "9", classification: "13A", manufactureDate: new Date("2023-01-01"), nextServiceDue: new Date(Date.now() + 30 * 86400000), hydrostaticTestDue: new Date(Date.now() + 365 * 86400000) }); unit = (await database.select().from(extinguisherUnits).where(eq(extinguisherUnits.id, Number(result[0].insertId))).limit(1))[0]; }
  await database.update(workOrders).set({ clientId: client.id, jobCode: workOrder.jobCode ?? `JOB-DEMO-${workOrder.id}`, visitType: "service" }).where(eq(workOrders.id, workOrder.id));
  const checklist = await database.select({ id: serviceChecklistItems.id }).from(serviceChecklistItems).where(and(eq(serviceChecklistItems.workOrderId, workOrder.id), eq(serviceChecklistItems.unitId, unit.id))).limit(1);
  if (!checklist[0]) await database.insert(serviceChecklistItems).values({ workOrderId: workOrder.id, unitId: unit.id });
}

export async function getServiceComplianceDetail(workOrderId: number) {
  await ensureComplianceDemoData(); const database = await requireDb(); const workOrder = (await database.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0]; if (!workOrder) throw new Error("Service work order not found");
  const [checklist, evidence, history, certificate] = await Promise.all([database.select().from(serviceChecklistItems).where(eq(serviceChecklistItems.workOrderId, workOrderId)), database.select().from(serviceEvidence).where(eq(serviceEvidence.workOrderId, workOrderId)), database.select().from(serviceWorkHistory).where(eq(serviceWorkHistory.workOrderId, workOrderId)).orderBy(desc(serviceWorkHistory.createdAt)), database.select().from(serviceCertificates).where(eq(serviceCertificates.workOrderId, workOrderId)).limit(1)]);
  const units = checklist.length ? await database.select().from(extinguisherUnits).where(inArray(extinguisherUnits.id, checklist.map(item => item.unitId))) : [];
  return { workOrder, checklist, evidence, units, history, certificate: certificate[0] ?? null };
}

async function refreshServiceReadiness(workOrderId: number) {
  const database = await requireDb(); const detail = await getServiceComplianceDetail(workOrderId); const readiness = evaluateServiceReadiness({ checklist: detail.checklist, evidence: detail.evidence, units: detail.units }); const evidenceProgress = detail.checklist.length ? Math.round((detail.checklist.filter(item => item.completed).length / detail.checklist.length) * 100) : 0;
  await database.update(workOrders).set({ evidenceProgress, evidenceStatus: readiness.hasFlaggedEvidence ? "flagged" : readiness.evidenceReady ? "ready" : "blocked", certificateReady: readiness.certificateReady, certificateBlockReason: readiness.blockReason }).where(eq(workOrders.id, workOrderId)); return readiness;
}

export async function updateServiceChecklist(workOrderId: number, unitId: number, userId: number, input: { confirmedType?: string; confirmedCapacityKg?: string; confirmedClassification?: string; specificationMismatch: boolean; gaugePressureOk: boolean; sealIntact: boolean; pinPresent: boolean; hoseNozzleOk: boolean; mountingOk: boolean; weightOk: boolean; tagAttached: boolean; notes?: string; completed: boolean }) {
  const database = await requireDb(); await database.update(serviceChecklistItems).set({ ...input, completedByUserId: input.completed ? userId : null, completedAt: input.completed ? new Date() : null }).where(and(eq(serviceChecklistItems.workOrderId, workOrderId), eq(serviceChecklistItems.unitId, unitId))); return refreshServiceReadiness(workOrderId);
}

export async function changeServiceWorkStatus(workOrderId: number, userId: number, status: "in_progress" | "awaiting_review" | "blocked", comments?: string) {
  const database = await requireDb(); const current = (await database.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0]; if (!current) throw new Error("Service work order not found"); if (status === "awaiting_review") { const detail = await getServiceComplianceDetail(workOrderId); if (detail.checklist.some(item => !item.completed) || !comments?.trim()) throw new Error("Complete every checklist and add service notes before submitting for review."); }
  await database.update(workOrders).set({ status, comments: comments ?? current.comments, reviewStatus: status === "awaiting_review" ? "pending_review" : current.reviewStatus }).where(eq(workOrders.id, workOrderId)); await database.insert(serviceWorkHistory).values({ workOrderId, changedByUserId: userId, previousStatus: current.status, nextStatus: status, previousReviewStatus: current.reviewStatus, nextReviewStatus: status === "awaiting_review" ? "pending_review" : current.reviewStatus, reason: comments ?? null }); return refreshServiceReadiness(workOrderId);
}

export async function reviewServiceWork(workOrderId: number, userId: number, decision: "approved" | "flagged", note: string) {
  const database = await requireDb(); const current = (await database.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0]; if (!current || current.status !== "awaiting_review") throw new Error("Only submitted work can be reviewed."); await database.update(workOrders).set({ status: decision === "approved" ? "complete" : "blocked", reviewStatus: decision, reviewedByUserId: userId, reviewNote: note }).where(eq(workOrders.id, workOrderId)); await database.insert(serviceWorkHistory).values({ workOrderId, changedByUserId: userId, previousStatus: current.status, nextStatus: decision === "approved" ? "complete" : "blocked", previousReviewStatus: current.reviewStatus, nextReviewStatus: decision, reason: note }); return refreshServiceReadiness(workOrderId);
}

export async function issueServiceCertificate(workOrderId: number, userId: number, expiresAt: Date) {
  const database = await requireDb(); const workOrder = (await database.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0]; if (!workOrder || !workOrder.clientId || workOrder.status !== "complete" || workOrder.reviewStatus !== "approved" || !workOrder.certificateReady) throw new Error(workOrder?.certificateBlockReason ?? "This service work order is not ready for certificate issuance."); const existing = (await database.select().from(serviceCertificates).where(eq(serviceCertificates.workOrderId, workOrderId)).limit(1))[0]; if (existing) return existing; const code = `CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; const result = await database.insert(serviceCertificates).values({ certificateCode: code, clientId: workOrder.clientId, workOrderId, issuedByUserId: userId, expiresAt }); return { id: Number(result[0].insertId), certificateCode: code, expiresAt };
}

export async function uploadServiceEvidence(workOrderId: number, unitId: number, userId: number, input: { phase: "before" | "after"; originalName: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; dataBase64: string }) {
  const database = await requireDb();
  const bytes = Buffer.from(input.dataBase64, "base64");
  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const stored = await storagePut(`fireguard/service/${workOrderId}/${unitId}/${input.phase}-${Date.now()}-${safeName}`, bytes, input.mimeType);
  const result = await database.insert(serviceEvidence).values({ workOrderId, unitId, phase: input.phase, fileKey: stored.key, storageUrl: stored.url, originalName: input.originalName, mimeType: input.mimeType, uploadedByUserId: userId });
  const readiness = await refreshServiceReadiness(workOrderId);
  return { id: Number(result[0].insertId), storageUrl: stored.url, readiness };
}

export async function flagServiceEvidence(evidenceId: number, userId: number, reason: string) {
  const database = await requireDb();
  const evidence = (await database.select().from(serviceEvidence).where(eq(serviceEvidence.id, evidenceId)).limit(1))[0];
  if (!evidence) throw new Error("Service evidence not found");
  await database.update(serviceEvidence).set({ isFlagged: true, flagReason: reason }).where(eq(serviceEvidence.id, evidenceId));
  const workOrder = (await database.select().from(workOrders).where(eq(workOrders.id, evidence.workOrderId)).limit(1))[0];
  if (workOrder) await database.insert(exceptions).values({ siteId: workOrder.siteId, workOrderId: evidence.workOrderId, title: "Service evidence flagged", detail: reason, severity: "high", status: "open", ownerUserId: userId });
  return refreshServiceReadiness(evidence.workOrderId);
}

type ChatMemberRow = typeof chatConversationMembers.$inferSelect;

async function getChatMembership(userId: number, conversationId: number) {
  const database = await requireDb();
  const member = (await database.select().from(chatConversationMembers).where(and(eq(chatConversationMembers.userId, userId), eq(chatConversationMembers.conversationId, conversationId))).limit(1))[0];
  if (!member) throw new Error("You do not have access to this Fireguard Chat conversation.");
  return member;
}

async function getChatUsers(userIds: number[]) {
  const database = await requireDb();
  if (!userIds.length) return [];
  return database.select({ id: users.id, name: users.name, role: users.role, lastActiveAt: users.lastActiveAt }).from(users).where(inArray(users.id, userIds));
}

/** Returns the authenticated operator's inbox, including private pin/archive/mute state and unread counts. */
export async function getChatInbox(userId: number) {
  await archiveExpiredTemporaryThreads();
  const database = await requireDb();
  const [viewerMemberships, people] = await Promise.all([
    database.select().from(chatConversationMembers).where(eq(chatConversationMembers.userId, userId)),
    database.select({ id: users.id, name: users.name, role: users.role, lastActiveAt: users.lastActiveAt }).from(users).where(ne(users.id, userId)).orderBy(users.name),
  ]);
  const conversationIds = viewerMemberships.map(member => member.conversationId);
  if (!conversationIds.length) return { conversations: [], people };

  const [conversationRows, memberRows, messageRows] = await Promise.all([
    database.select().from(chatConversations).where(inArray(chatConversations.id, conversationIds)),
    database.select().from(chatConversationMembers).where(inArray(chatConversationMembers.conversationId, conversationIds)),
    database.select().from(chatMessages).where(inArray(chatMessages.conversationId, conversationIds)).orderBy(desc(chatMessages.createdAt)).limit(500),
  ]);
  const allUserIds = Array.from(new Set(memberRows.map(member => member.userId)));
  const operatorRows = await getChatUsers(allUserIds);
  const operatorsById = new Map(operatorRows.map(operator => [operator.id, operator]));
  const viewerMembershipByConversation = new Map(viewerMemberships.map(member => [member.conversationId, member]));

  const conversations = conversationRows.map(conversation => {
    const viewerMembership = viewerMembershipByConversation.get(conversation.id)!;
    const members = memberRows.filter(member => member.conversationId === conversation.id).map(member => ({
      id: member.userId,
      name: operatorsById.get(member.userId)?.name ?? "FireGuard operator",
      role: member.role,
      isActive: isRecentlyActive(operatorsById.get(member.userId)?.lastActiveAt ?? null),
    }));
    const lastMessage = messageRows.find(message => message.conversationId === conversation.id) ?? null;
    const unreadCount = messageRows.filter(message => message.conversationId === conversation.id && message.authorUserId !== userId && message.id > (viewerMembership.lastReadMessageId ?? 0)).length;
    const otherOperator = members.find(member => member.id !== userId);
    const displayName = conversation.kind === "group" ? (conversation.title ?? "Untitled coordination") : (otherOperator?.name ?? "Direct coordination");
    return {
      ...conversation,
      isArchived: isTemporaryThreadArchived(conversation),
      displayName,
      viewer: { role: viewerMembership.role, pinnedAt: viewerMembership.pinnedAt, archivedAt: viewerMembership.archivedAt, mutedUntil: viewerMembership.mutedUntil, isMuted: isMuted(viewerMembership.mutedUntil) },
      members,
      lastMessage: lastMessage ? { id: lastMessage.id, body: lastMessage.body, createdAt: lastMessage.createdAt, authorName: operatorsById.get(lastMessage.authorUserId)?.name ?? "FireGuard operator" } : null,
      unreadCount,
    };
  }).sort((left, right) => compareChatInbox({ pinnedAt: left.viewer.pinnedAt, updatedAt: left.updatedAt }, { pinnedAt: right.viewer.pinnedAt, updatedAt: right.updatedAt }));
  return { conversations, people };
}

/** Returns one authorised conversation thread and aggregates reactions without exposing email or login identity. */
export async function getChatConversation(userId: number, conversationId: number) {
  await archiveExpiredTemporaryThreads();
  const database = await requireDb();
  const viewer = await getChatMembership(userId, conversationId);
  const [conversation] = await database.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
  if (!conversation) throw new Error("Conversation not found.");
  const [memberRows, messageRows] = await Promise.all([
    database.select().from(chatConversationMembers).where(eq(chatConversationMembers.conversationId, conversationId)),
    database.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt).limit(200),
  ]);
  const operatorRows = await getChatUsers(memberRows.map(member => member.userId));
  const operatorsById = new Map(operatorRows.map(operator => [operator.id, operator]));
  const messageIds = messageRows.map(message => message.id);
  const reactionRows = messageIds.length ? await database.select().from(chatMessageReactions).where(inArray(chatMessageReactions.messageId, messageIds)) : [];
  const reactionsByMessage = new Map<number, { emoji: string; count: number; reactedByViewer: boolean }[]>();
  for (const reaction of reactionRows) {
    const values = reactionsByMessage.get(reaction.messageId) ?? [];
    const existing = values.find(value => value.emoji === reaction.emoji);
    if (existing) { existing.count += 1; existing.reactedByViewer ||= reaction.userId === userId; }
    else values.push({ emoji: reaction.emoji, count: 1, reactedByViewer: reaction.userId === userId });
    reactionsByMessage.set(reaction.messageId, values);
  }
  return {
    conversation: { ...conversation, isArchived: isTemporaryThreadArchived(conversation) },
    viewer: { role: viewer.role, isMuted: isMuted(viewer.mutedUntil), pinnedAt: viewer.pinnedAt, archivedAt: viewer.archivedAt },
    members: memberRows.map(member => ({ id: member.userId, name: operatorsById.get(member.userId)?.name ?? "FireGuard operator", role: member.role, isActive: isRecentlyActive(operatorsById.get(member.userId)?.lastActiveAt ?? null) })),
    messages: messageRows.map(message => ({ ...message, authorName: operatorsById.get(message.authorUserId)?.name ?? "FireGuard operator", authorRole: operatorsById.get(message.authorUserId)?.role ?? "field", reactions: reactionsByMessage.get(message.id) ?? [] })),
  };
}

export async function createDirectChat(userId: number, recipientUserId: number) {
  const database = await requireDb();
  const directKey = canonicalDirectKey(userId, recipientUserId);
  const [existing] = await database.select({ id: chatConversations.id }).from(chatConversations).where(eq(chatConversations.directKey, directKey)).limit(1);
  if (existing) return getChatConversation(userId, existing.id);
  const recipients = await getChatUsers([userId, recipientUserId]);
  if (recipients.length !== 2) throw new Error("The selected operator is no longer available.");
  const created = await database.insert(chatConversations).values({ kind: "direct", directKey, createdByUserId: userId });
  const conversationId = Number(created[0].insertId);
  await database.insert(chatConversationMembers).values([{ conversationId, userId, role: "owner" }, { conversationId, userId: recipientUserId, role: "member" }]);
  return getChatConversation(userId, conversationId);
}

export async function createGroupChat(userId: number, input: { title: string; memberUserIds: number[] }) {
  const database = await requireDb();
  const participantIds = Array.from(new Set([userId, ...input.memberUserIds]));
  const participants = await getChatUsers(participantIds);
  if (participants.length !== participantIds.length) throw new Error("One or more selected operators are no longer available.");
  const created = await database.insert(chatConversations).values({ kind: "group", title: input.title, createdByUserId: userId });
  const conversationId = Number(created[0].insertId);
  await database.insert(chatConversationMembers).values(participantIds.map(participantId => ({ conversationId, userId: participantId, role: participantId === userId ? "owner" as const : "member" as const })));
  return getChatConversation(userId, conversationId);
}

/** Creates a short-lived coordination group for a specific client, project, or operational handoff. */
export async function createTemporaryGroupChat(userId: number, input: { title: string; contextLabel: string; clientId?: number | null; durationHours: number; memberUserIds: number[] }) {
  const database = await requireDb();
  const participantIds = Array.from(new Set([userId, ...input.memberUserIds]));
  const participants = await getChatUsers(participantIds);
  if (participants.length !== participantIds.length) throw new Error("One or more selected operators are no longer available.");
  const conversationId = await persistTemporaryGroupChat(database, userId, input, participantIds);
  return getChatConversation(userId, conversationId);
}

/** Persists the conversation and all member rows as one testable creation unit. */
export async function persistTemporaryGroupChat(database: Pick<ReturnType<typeof drizzle>, "insert">, userId: number, input: { title: string; contextLabel: string; clientId?: number | null; durationHours: number }, participantIds: number[], now = new Date()) {
  const created = await database.insert(chatConversations).values(temporaryThreadConversationValues(input, userId, now));
  const conversationId = Number(created[0].insertId);
  await database.insert(chatConversationMembers).values(participantIds.map(participantId => ({ conversationId, userId: participantId, role: participantId === userId ? "owner" as const : "member" as const })));
  return conversationId;
}

async function requireGroupAdministrator(userId: number, conversationId: number) {
  const detail = await getChatConversation(userId, conversationId);
  if (detail.conversation.kind !== "group") throw new Error("Only group conversations can be administered.");
  if (detail.conversation.isArchived) throw new Error("This temporary coordination thread has been archived and cannot be changed.");
  if (detail.viewer.role !== "owner" && detail.viewer.role !== "admin") throw new Error("Group administrator access is required for this action.");
  return detail;
}

export async function addChatGroupMembers(userId: number, conversationId: number, memberUserIds: number[]) {
  const database = await requireDb();
  const detail = await requireGroupAdministrator(userId, conversationId);
  const existingIds = new Set(detail.members.map(member => member.id));
  const freshIds = Array.from(new Set(memberUserIds)).filter(id => !existingIds.has(id));
  if (!freshIds.length) return detail;
  const people = await getChatUsers(freshIds);
  if (people.length !== freshIds.length) throw new Error("One or more selected operators are no longer available.");
  await database.insert(chatConversationMembers).values(freshIds.map(memberUserId => ({ conversationId, userId: memberUserId, role: "member" as const })));
  await database.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId));
  return getChatConversation(userId, conversationId);
}

export async function sendChatMessage(userId: number, conversationId: number, body: string) {
  const database = await requireDb();
  await getChatMembership(userId, conversationId);
  const conversation = (await database.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1))[0];
  if (!conversation) throw new Error("Conversation not found.");
  if (isTemporaryThreadArchived(conversation)) {
    await archiveExpiredTemporaryThreads();
    throw new Error("This temporary coordination thread has expired and is now archived.");
  }
  const created = await database.insert(chatMessages).values({ conversationId, authorUserId: userId, body });
  const messageId = Number(created[0].insertId);
  await Promise.all([
    database.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId)),
    database.update(chatConversationMembers).set({ lastReadMessageId: messageId }).where(and(eq(chatConversationMembers.conversationId, conversationId), eq(chatConversationMembers.userId, userId))),
  ]);
  return getChatConversation(userId, conversationId);
}

export async function markChatRead(userId: number, conversationId: number) {
  const database = await requireDb();
  await getChatMembership(userId, conversationId);
  const latest = (await database.select({ id: chatMessages.id }).from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(desc(chatMessages.id)).limit(1))[0];
  if (latest) await database.update(chatConversationMembers).set({ lastReadMessageId: latest.id }).where(and(eq(chatConversationMembers.conversationId, conversationId), eq(chatConversationMembers.userId, userId)));
  return { ok: true } as const;
}

export async function toggleChatReaction(userId: number, messageId: number, emoji: string) {
  const database = await requireDb();
  const message = (await database.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1))[0];
  if (!message) throw new Error("Message not found.");
  await getChatMembership(userId, message.conversationId);
  const conversation = (await database.select().from(chatConversations).where(eq(chatConversations.id, message.conversationId)).limit(1))[0];
  if (!conversation) throw new Error("Conversation not found.");
  if (isTemporaryThreadArchived(conversation)) throw new Error("This temporary coordination thread has expired and is now archived.");
  const existing = (await database.select().from(chatMessageReactions).where(and(eq(chatMessageReactions.messageId, messageId), eq(chatMessageReactions.userId, userId), eq(chatMessageReactions.emoji, emoji))).limit(1))[0];
  if (existing) await database.delete(chatMessageReactions).where(eq(chatMessageReactions.id, existing.id));
  else await database.insert(chatMessageReactions).values({ messageId, userId, emoji });
  return getChatConversation(userId, message.conversationId);
}

export async function toggleChatInboxControl(userId: number, conversationId: number, action: "pin" | "archive" | "mute") {
  const database = await requireDb();
  const membership: ChatMemberRow = await getChatMembership(userId, conversationId);
  const conversation = (await database.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1))[0];
  if (!conversation) throw new Error("Conversation not found.");
  if (conversation.archivedAt && action === "archive") throw new Error("This temporary coordination thread is archived for every member and cannot be restored.");
  const now = new Date();
  const patch = action === "pin"
    ? { pinnedAt: membership.pinnedAt ? null : now }
    : action === "archive"
      ? { archivedAt: membership.archivedAt ? null : now }
      : { mutedUntil: isMuted(membership.mutedUntil, now) ? null : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
  await database.update(chatConversationMembers).set(patch).where(eq(chatConversationMembers.id, membership.id));
  return { ok: true } as const;
}

async function requireTemporaryThreadCreator(database: Awaited<ReturnType<typeof getDb>>, userId: number, conversationId: number) {
  if (!database) throw new Error("FireGuard data service is unavailable");
  const conversation = (await database.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1))[0];
  if (!conversation || !conversation.isTemporary) throw new Error("Only temporary coordination threads have lifecycle controls.");
  if (!canControlTemporaryThread(conversation, userId)) {
    if (conversation.archivedAt) throw new Error("This temporary coordination thread is already archived.");
    throw new Error("Only the thread creator can extend or archive this temporary coordination thread.");
  }
  if (isTemporaryThreadArchived(conversation)) {
    await archiveExpiredTemporaryThreads();
    throw new Error("This temporary coordination thread has expired and is now archived.");
  }
  return conversation;
}

/** The thread creator can add 1–168 hours from the active expiry, preserving the all-member conversation record. */
export async function extendTemporaryThread(userId: number, conversationId: number, additionalHours: number) {
  const database = await requireDb();
  const conversation = await requireTemporaryThreadCreator(database, userId, conversationId);
  const now = new Date();
  const expiresAt = extendedTemporaryThreadExpiry(conversation.expiresAt, additionalHours, now);
  await persistTemporaryThreadExtension(database, conversationId, expiresAt, now);
  return getChatConversation(userId, conversationId);
}

/** The thread creator can close a temporary coordination record for every member before its scheduled expiry. */
export async function archiveTemporaryThread(userId: number, conversationId: number) {
  const database = await requireDb();
  await requireTemporaryThreadCreator(database, userId, conversationId);
  const now = new Date();
  await persistManualTemporaryThreadArchive(database, conversationId, now);
  return getChatConversation(userId, conversationId);
}

/** Persists a creator-approved expiry extension without altering membership or message history. */
export async function persistTemporaryThreadExtension(database: Pick<ReturnType<typeof drizzle>, "update">, conversationId: number, expiresAt: Date, now = new Date()) {
  await database.update(chatConversations).set({ expiresAt, updatedAt: now }).where(eq(chatConversations.id, conversationId));
}

/** Persists a creator-approved conversation-wide archive, preserving a read-only record for every member. */
export async function persistManualTemporaryThreadArchive(database: Pick<ReturnType<typeof drizzle>, "update">, conversationId: number, now = new Date()) {
  await database.update(chatConversations).set({ archivedAt: now, archiveReason: "manual", updatedAt: now }).where(eq(chatConversations.id, conversationId));
  await database.update(chatConversationMembers).set({ archivedAt: now }).where(and(eq(chatConversationMembers.conversationId, conversationId), isNull(chatConversationMembers.archivedAt)));
}

/** Archives all expired temporary groups and every member's inbox view. Safe to call repeatedly. */
export async function archiveExpiredTemporaryThreads(now = new Date(), databaseOverride?: Awaited<ReturnType<typeof getDb>>) {
  const database = databaseOverride ?? await requireDb();
  const expired = await database.select({ id: chatConversations.id }).from(chatConversations).where(and(eq(chatConversations.isTemporary, true), lte(chatConversations.expiresAt, now), isNull(chatConversations.archivedAt)));
  const conversationIds = expired.map(item => item.id);
  if (!conversationIds.length) return { archivedCount: 0 } as const;
  await database.update(chatConversations).set({ archivedAt: now, archiveReason: "expired" }).where(inArray(chatConversations.id, conversationIds));
  await database.update(chatConversationMembers).set({ archivedAt: now }).where(and(inArray(chatConversationMembers.conversationId, conversationIds), isNull(chatConversationMembers.archivedAt)));
  return { archivedCount: conversationIds.length } as const;
}

export async function getTemporaryThreadArchiveScheduleByTaskUid(taskUid: string) {
  const database = await requireDb();
  return (await database.select().from(temporaryThreadArchiveSchedules).where(eq(temporaryThreadArchiveSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function recordTemporaryThreadArchiveRun(scheduleId: number) {
  const database = await requireDb();
  await database.update(temporaryThreadArchiveSchedules).set({ lastRunAt: new Date() }).where(eq(temporaryThreadArchiveSchedules.id, scheduleId));
}

const parseLocations = (value: string | null) => value ? value.split("|").map(location => location.trim()).filter(Boolean) : [];

const startOfUtcWeek = () => {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - day + 1);
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

/** Returns the signed-in operator’s editable profile plus real work, training, and timekeeping data. */
export async function getProfileDashboard(userId: number) {
  const database = await requireDb();
  const user = (await database.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) throw new Error("FireGuard operator was not found.");

  const [profile, preferences, certifications, recentTimeEntries, openTimeEntry, upcomingShifts, recentAudits, completedWorkOrders, completedLearning, weeklyTimeEntries] = await Promise.all([
    database.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId)).limit(1).then(rows => rows[0]),
    database.select().from(profilePreferences).where(eq(profilePreferences.userId, userId)).limit(1).then(rows => rows[0]),
    database.select().from(profileCertifications).where(eq(profileCertifications.userId, userId)).orderBy(profileCertifications.expiresAt),
    database.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.clockedInAt)).limit(6),
    database.select().from(timeEntries).where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockedOutAt))).orderBy(desc(timeEntries.clockedInAt)).limit(1).then(rows => rows[0]),
    database.select({ id: workOrders.id, title: workOrders.title, workType: workOrders.workType, scheduledFor: workOrders.scheduledFor, status: workOrders.status, siteName: sites.name }).from(workOrders).innerJoin(sites, eq(workOrders.siteId, sites.id)).where(and(eq(workOrders.assignedUserId, userId), gte(workOrders.scheduledFor, new Date()))).orderBy(workOrders.scheduledFor).limit(4),
    database.select().from(profileAccessAudits).where(eq(profileAccessAudits.userId, userId)).orderBy(desc(profileAccessAudits.createdAt)).limit(6),
    database.select({ id: workOrders.id }).from(workOrders).where(and(eq(workOrders.assignedUserId, userId), eq(workOrders.status, "complete"))),
    database.select({ id: academyCourseProgress.id }).from(academyCourseProgress).where(and(eq(academyCourseProgress.userId, userId), eq(academyCourseProgress.status, "complete"))),
    database.select().from(timeEntries).where(and(eq(timeEntries.userId, userId), gte(timeEntries.clockedInAt, startOfUtcWeek()))),
  ]);

  const now = new Date();
  const weeklyHours = weeklyTimeEntries.reduce((total, entry) => total + Math.max(0, ((entry.clockedOutAt ?? now).getTime() - entry.clockedInAt.getTime()) / 3_600_000), 0);
  return {
    user: { id: user.id, name: user.name ?? "FireGuard operator", email: user.email ?? "", role: user.role },
    profile: {
      employeeId: profile?.employeeId ?? "",
      phone: profile?.phone ?? "",
      title: profile?.title ?? profileRoleTitle(user.role),
      photoUrl: profile?.photoUrl ?? "",
      locations: parseLocations(profile?.locationNames ?? null),
      employmentStatus: profile?.employmentStatus ?? "active",
      hireDate: profile?.hireDate ?? user.createdAt,
    },
    preferences: {
      notifyAssignments: preferences?.notifyAssignments ?? true,
      notifyExceptions: preferences?.notifyExceptions ?? true,
      notifyLearning: preferences?.notifyLearning ?? true,
      language: preferences?.language ?? "en-US",
      compactDensity: preferences?.compactDensity ?? false,
      pinConfigured: Boolean(preferences?.pinHash),
      pinUpdatedAt: preferences?.pinUpdatedAt ?? null,
    },
    permissions: {
      role: user.role,
      grants: user.role === "admin" ? ["Workspace administration", "Team supervision", "Evidence review", "Field operations"] : user.role === "manager" ? ["Team supervision", "Evidence review", "Field operations"] : user.role === "reviewer" ? ["Evidence review", "Field operations"] : ["Field operations"],
    },
    certifications,
    timeEntries: recentTimeEntries,
    openTimeEntry: openTimeEntry ?? null,
    upcomingShifts,
    audits: recentAudits,
    metrics: { completedWorkOrders: completedWorkOrders.length, completedLearning: completedLearning.length, weeklyHours: Math.round(weeklyHours * 10) / 10 },
  };
}

export async function updateEmployeeProfile(userId: number, input: { name: string; employeeId: string; phone: string; title: string; photoUrl: string; locations: string[]; employmentStatus: "active" | "on_leave" | "terminated"; hireDate: Date | null }) {
  const database = await requireDb();
  const profileValues = {
    employeeId: input.employeeId.trim() || null,
    phone: input.phone.trim() || null,
    title: input.title.trim() || null,
    photoUrl: input.photoUrl.trim() || null,
    locationNames: input.locations.map(location => location.trim()).filter(Boolean).join("|") || null,
    employmentStatus: input.employmentStatus,
    hireDate: input.hireDate,
  };
  await database.update(users).set({ name: input.name.trim() || null }).where(eq(users.id, userId));
  await database.insert(employeeProfiles).values({ userId, ...profileValues }).onDuplicateKeyUpdate({ set: profileValues });
  await database.insert(profileAccessAudits).values({ userId, changedByUserId: userId, eventType: "profile_updated", detail: "Personal and employment information updated." });
  return getProfileDashboard(userId);
}

export async function updateProfilePreferences(userId: number, input: { notifyAssignments: boolean; notifyExceptions: boolean; notifyLearning: boolean; language: string; compactDensity: boolean }) {
  const database = await requireDb();
  await database.insert(profilePreferences).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  await database.insert(profileAccessAudits).values({ userId, changedByUserId: userId, eventType: "preferences_updated", detail: "Notification, language, or workspace density preferences updated." });
  return getProfileDashboard(userId);
}

/** A short access PIN is salted and hashed; the raw PIN is never persisted or returned to the client. */
export async function resetProfilePin(userId: number, pin: string) {
  const database = await requireDb();
  const salt = randomBytes(16).toString("hex");
  const pinHash = `${salt}:${scryptSync(pin, salt, 64).toString("hex")}`;
  const pinUpdatedAt = new Date();
  await database.insert(profilePreferences).values({ userId, pinHash, pinUpdatedAt }).onDuplicateKeyUpdate({ set: { pinHash, pinUpdatedAt } });
  await database.insert(profileAccessAudits).values({ userId, changedByUserId: userId, eventType: "pin_reset", detail: "Access PIN was reset by the signed-in operator." });
  return { ok: true } as const;
}

export async function addProfileCertification(userId: number, input: { name: string; authority: string; expiresAt: Date }) {
  const database = await requireDb();
  await database.insert(profileCertifications).values({ userId, name: input.name.trim(), authority: input.authority.trim() || null, expiresAt: input.expiresAt });
  return getProfileDashboard(userId);
}

export async function deleteProfileCertification(userId: number, certificationId: number) {
  const database = await requireDb();
  await database.delete(profileCertifications).where(and(eq(profileCertifications.id, certificationId), eq(profileCertifications.userId, userId)));
  return getProfileDashboard(userId);
}

export async function clockInProfile(userId: number) {
  const database = await requireDb();
  const existing = (await database.select({ id: timeEntries.id }).from(timeEntries).where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockedOutAt))).limit(1))[0];
  if (existing) throw new Error("You are already clocked in.");
  await database.insert(timeEntries).values({ userId, source: "profile" });
  return getProfileDashboard(userId);
}

export async function clockOutProfile(userId: number) {
  const database = await requireDb();
  const activeEntry = (await database.select({ id: timeEntries.id }).from(timeEntries).where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockedOutAt))).orderBy(desc(timeEntries.clockedInAt)).limit(1))[0];
  if (!activeEntry) throw new Error("There is no active shift to clock out from.");
  await database.update(timeEntries).set({ clockedOutAt: new Date() }).where(eq(timeEntries.id, activeEntry.id));
  return getProfileDashboard(userId);
}

/** Administrator sessions may adjust their own active FireGuard role; every change is added to the immutable profile audit trail. */
export async function updateCurrentProfileRole(userId: number, role: "user" | "field" | "reviewer" | "manager" | "admin") {
  const database = await requireDb();
  const current = (await database.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!current) throw new Error("FireGuard operator was not found.");
  if (current.role === role) return getProfileDashboard(userId);
  await database.update(users).set({ role }).where(eq(users.id, userId));
  await database.insert(profileAccessAudits).values({ userId, changedByUserId: userId, eventType: "permission_changed", detail: `Role changed from ${profileRoleTitle(current.role)} to ${profileRoleTitle(role)} by an administrator session.` });
  return getProfileDashboard(userId);
}
