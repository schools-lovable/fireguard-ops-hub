import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * FireGuard role model: field teams execute work, reviewers approve evidence,
 * managers administer operations, and admins retain full project control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "field", "reviewer", "manager", "admin", "technician", "sales", "finance"]).default("field").notNull(),
  /** Role-PIN accounts can be paused without changing their configured credential. */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Updated by the authenticated application shell; users expire from the live roster after a short inactivity window. */
  lastActiveAt: timestamp("lastActiveAt"),
  /** The authenticated application shell records the active route alongside each heartbeat. */
  currentRoute: varchar("currentRoute", { length: 160 }),
}, table => [index("users_last_active_at_idx").on(table.lastActiveAt)]);

/** Clients are the commercial account boundary for one or more managed sites. */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  portfolioOwnerName: varchar("portfolioOwnerName", { length: 120 }).notNull(),
  readinessStatus: mysqlEnum("readinessStatus", ["ready", "review", "risk"]).default("review").notNull(),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("clients_readiness_status_idx").on(table.readinessStatus)]);

/** Sites are physical locations that carry a safety schedule and operational readiness status. */
export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  address: varchar("address", { length: 240 }).notNull(),
  readinessStatus: mysqlEnum("readinessStatus", ["ready", "review", "risk"]).default("review").notNull(),
  nextInspectionAt: timestamp("nextInspectionAt"),
  /** Nullable so historical sites remain valid until a trusted pin is captured or geocoded. */
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  locationSource: mysqlEnum("locationSource", ["manual", "gps_capture", "geocoded"]).default("manual").notNull(),
  locationCapturedBy: varchar("locationCapturedBy", { length: 191 }),
  locationCapturedAt: timestamp("locationCapturedAt"),
  locationAccuracyMeters: decimal("locationAccuracyMeters", { precision: 8, scale: 2 }),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("sites_client_id_idx").on(table.clientId), index("sites_readiness_status_idx").on(table.readinessStatus), index("sites_location_idx").on(table.latitude, table.longitude)]);

/** Immutable audit events preserve the location trail when a field capture or manager correction changes a site pin. */
export const siteLocationHistory = mysqlTable("site_location_history", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  previousLatitude: decimal("previousLatitude", { precision: 10, scale: 7 }),
  previousLongitude: decimal("previousLongitude", { precision: 10, scale: 7 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  source: mysqlEnum("source", ["manual", "gps_capture", "geocoded"]).notNull(),
  accuracyMeters: decimal("accuracyMeters", { precision: 8, scale: 2 }),
  capturedByUserId: int("capturedByUserId").notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
}, table => [index("site_location_history_site_idx").on(table.siteId, table.capturedAt)]);

/** Work orders connect scheduled safety work to the site where it must be performed. */
export const workOrders = mysqlTable("work_orders", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  workType: varchar("workType", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["scheduled", "in_progress", "awaiting_review", "blocked", "complete"]).default("scheduled").notNull(),
  evidenceProgress: int("evidenceProgress").default(0).notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  dueAt: timestamp("dueAt"),
  assignedUserId: int("assignedUserId"),
  /** Compatibility fields for the original service-compliance workflow. */
  jobCode: varchar("jobCode", { length: 40 }),
  clientId: int("clientId"),
  reviewStatus: mysqlEnum("reviewStatus", ["pending_review", "approved", "flagged"]),
  evidenceStatus: mysqlEnum("evidenceStatus", ["not_started", "ready", "flagged", "blocked"]).default("not_started").notNull(),
  visitType: mysqlEnum("visitType", ["service", "refill", "service_refill", "replacement"]).default("service").notNull(),
  comments: text("comments"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewNote: text("reviewNote"),
  certificateReady: boolean("certificateReady").default(false).notNull(),
  certificateBlockReason: text("certificateBlockReason"),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("work_orders_site_id_idx").on(table.siteId),
  index("work_orders_status_idx").on(table.status),
  index("work_orders_scheduled_for_idx").on(table.scheduledFor),
  index("work_orders_review_status_idx").on(table.reviewStatus),
]);

/** Physical extinguisher assets retain their recurring service and hydrostatic-test dates. */
export const extinguisherUnits = mysqlTable("extinguisher_units", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  serialNumber: varchar("serialNumber", { length: 128 }).notNull().unique(),
  extinguisherType: varchar("extinguisherType", { length: 64 }).notNull(),
  capacityKg: varchar("capacityKg", { length: 16 }).notNull(),
  classification: varchar("classification", { length: 64 }).notNull(),
  manufactureDate: timestamp("manufactureDate").notNull(),
  installDate: timestamp("installDate"),
  lastServiceDate: timestamp("lastServiceDate"),
  nextServiceDue: timestamp("nextServiceDue"),
  hydrostaticTestDue: timestamp("hydrostaticTestDue"),
  status: mysqlEnum("status", ["in_service", "due", "overdue", "retired"]).default("in_service").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("extinguisher_units_site_idx").on(table.siteId), index("extinguisher_units_due_idx").on(table.nextServiceDue)]);

/** A work-order checklist item binds a service visit to a specific extinguisher asset. */
export const serviceChecklistItems = mysqlTable("service_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  unitId: int("unitId").notNull(),
  confirmedType: varchar("confirmedType", { length: 64 }),
  confirmedCapacityKg: varchar("confirmedCapacityKg", { length: 16 }),
  confirmedClassification: varchar("confirmedClassification", { length: 64 }),
  specificationMismatch: boolean("specificationMismatch").default(false).notNull(),
  gaugePressureOk: boolean("gaugePressureOk"), sealIntact: boolean("sealIntact"), pinPresent: boolean("pinPresent"), hoseNozzleOk: boolean("hoseNozzleOk"), mountingOk: boolean("mountingOk"), weightOk: boolean("weightOk"), tagAttached: boolean("tagAttached"),
  notes: text("notes"), completed: boolean("completed").default(false).notNull(), completedByUserId: int("completedByUserId"), completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [unique("service_checklist_work_order_unit_uq").on(table.workOrderId, table.unitId), index("service_checklist_work_order_idx").on(table.workOrderId)]);

/** Before/after evidence is stored in managed object storage; only references are persisted. */
export const serviceEvidence = mysqlTable("service_evidence", {
  id: int("id").autoincrement().primaryKey(), workOrderId: int("workOrderId").notNull(), unitId: int("unitId").notNull(), phase: mysqlEnum("phase", ["before", "after"]).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), storageUrl: varchar("storageUrl", { length: 1024 }).notNull(), originalName: varchar("originalName", { length: 255 }).notNull(), mimeType: varchar("mimeType", { length: 128 }).notNull(),
  uploadedByUserId: int("uploadedByUserId").notNull(), isFlagged: boolean("isFlagged").default(false).notNull(), flagReason: text("flagReason"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("service_evidence_work_order_idx").on(table.workOrderId)]);

export const serviceWorkHistory = mysqlTable("service_work_history", {
  id: int("id").autoincrement().primaryKey(), workOrderId: int("workOrderId").notNull(), previousStatus: varchar("previousStatus", { length: 32 }), nextStatus: varchar("nextStatus", { length: 32 }).notNull(), previousReviewStatus: varchar("previousReviewStatus", { length: 32 }), nextReviewStatus: varchar("nextReviewStatus", { length: 32 }), reason: text("reason"), changedByUserId: int("changedByUserId").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("service_work_history_work_order_idx").on(table.workOrderId, table.createdAt)]);

export const serviceCertificates = mysqlTable("service_certificates", {
  id: int("id").autoincrement().primaryKey(), certificateCode: varchar("certificateCode", { length: 40 }).notNull().unique(), clientId: int("clientId").notNull(), workOrderId: int("workOrderId").notNull().unique(), issuedByUserId: int("issuedByUserId").notNull(), issuedAt: timestamp("issuedAt").defaultNow().notNull(), expiresAt: timestamp("expiresAt").notNull(),
});

/** Exceptions track safety gaps that must be acknowledged, owned, and resolved. */
export const exceptions = mysqlTable("exceptions", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  workOrderId: int("workOrderId"),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  severity: mysqlEnum("severity", ["high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  ownerUserId: int("ownerUserId"),
  dueAt: timestamp("dueAt"),
  resolvedAt: timestamp("resolvedAt"),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("exceptions_site_id_idx").on(table.siteId),
  index("exceptions_status_idx").on(table.status),
  index("exceptions_due_at_idx").on(table.dueAt),
]);

/** In-app notifications are the durable delivery record for digest and overdue-alert events. */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientUserId: int("recipientUserId"),
  sourceExceptionId: int("sourceExceptionId"),
  dedupeKey: varchar("dedupeKey", { length: 120 }).unique(),
  kind: mysqlEnum("kind", ["digest", "overdue", "assignment", "report", "presence", "learning"]).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  href: varchar("href", { length: 260 }).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("notifications_recipient_idx").on(table.recipientUserId),
  index("notifications_read_idx").on(table.isRead),
  index("notifications_priority_idx").on(table.priority),
]);

/** Notification schedules retain the platform task identifier so managers can inspect or pause future runs safely. */
export const notificationSchedules = mysqlTable("notification_schedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  cron: varchar("cron", { length: 80 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("notification_schedule_task_uid_idx").on(table.scheduleCronTaskUid)]);

/** Exports keep a simple audit trail without storing file bytes inside the operational database. */
export const reportExports = mysqlTable("report_exports", {
  id: int("id").autoincrement().primaryKey(),
  requestedByUserId: int("requestedByUserId").notNull(),
  reportType: mysqlEnum("reportType", ["readiness", "service", "exceptions"]).notNull(),
  rowCount: int("rowCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Each manager can opt into online-arrival alerts by operational role. */
export const presenceAlertPreferences = mysqlTable("presence_alert_preferences", {
  id: int("id").autoincrement().primaryKey(),
  managerUserId: int("managerUserId").notNull().unique(),
  alertFieldTeam: boolean("alertFieldTeam").default(false).notNull(),
  alertReviewers: boolean("alertReviewers").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Employee-owned profile data stays separate from OAuth identity so FireGuard can retain operational context safely. */
export const employeeProfiles = mysqlTable("employee_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  employeeId: varchar("employeeId", { length: 64 }),
  phone: varchar("phone", { length: 40 }),
  title: varchar("title", { length: 120 }),
  photoUrl: varchar("photoUrl", { length: 500 }),
  locationNames: text("locationNames"),
  employmentStatus: mysqlEnum("employmentStatus", ["active", "on_leave", "terminated"]).default("active").notNull(),
  hireDate: timestamp("hireDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("employee_profiles_status_idx").on(table.employmentStatus)]);

/** Personal delivery and language settings are scoped to the signed-in FireGuard operator. */
export const profilePreferences = mysqlTable("profile_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  notifyAssignments: boolean("notifyAssignments").default(true).notNull(),
  notifyExceptions: boolean("notifyExceptions").default(true).notNull(),
  notifyLearning: boolean("notifyLearning").default(true).notNull(),
  language: varchar("language", { length: 12 }).default("en-US").notNull(),
  compactDensity: boolean("compactDensity").default(false).notNull(),
  pinHash: varchar("pinHash", { length: 255 }),
  pinUpdatedAt: timestamp("pinUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Access-changing profile actions are retained for accountable permission and credential management. */
export const profileAccessAudits = mysqlTable("profile_access_audits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  changedByUserId: int("changedByUserId").notNull(),
  eventType: mysqlEnum("eventType", ["profile_updated", "preferences_updated", "pin_reset", "permission_changed"]).notNull(),
  detail: varchar("detail", { length: 240 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("profile_access_audits_user_idx").on(table.userId), index("profile_access_audits_created_idx").on(table.createdAt)]);

/** Credentials and licensing records let operators surface renewals before compliance is at risk. */
export const profileCertifications = mysqlTable("profile_certifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  authority: varchar("authority", { length: 160 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("profile_certifications_user_idx").on(table.userId), index("profile_certifications_expiry_idx").on(table.expiresAt)]);

/** Clock events are intentionally user-scoped and independent from work orders so timekeeping remains auditable. */
export const timeEntries = mysqlTable("time_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clockedInAt: timestamp("clockedInAt").defaultNow().notNull(),
  clockedOutAt: timestamp("clockedOutAt"),
  source: varchar("source", { length: 40 }).default("profile").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("time_entries_user_clock_in_idx").on(table.userId, table.clockedInAt), index("time_entries_user_clock_out_idx").on(table.userId, table.clockedOutAt)]);

/** Academy courses are published learning pathways for FireGuard staff. Example content is explicitly distinguishable from an approved operational curriculum. */
export const academyCourses = mysqlTable("academy_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 90 }).notNull(),
  level: mysqlEnum("level", ["foundation", "intermediate", "advanced"]).default("foundation").notNull(),
  estimatedMinutes: int("estimatedMinutes").default(0).notNull(),
  requiredRole: mysqlEnum("requiredRole", ["all", "field", "reviewer", "manager"]).default("all").notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("academy_courses_published_idx").on(table.isPublished)]);

/** Lessons can present approved video links, instructional text, self-check quizzes, or review flashcards. */
export const academyLessons = mysqlTable("academy_lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  lessonType: mysqlEnum("lessonType", ["video", "reading", "quiz", "flashcards"]).notNull(),
  body: text("body").notNull(),
  videoUrl: varchar("videoUrl", { length: 500 }),
  durationMinutes: int("durationMinutes").default(5).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("academy_lessons_course_idx").on(table.courseId), index("academy_lessons_course_order_idx").on(table.courseId, table.sortOrder)]);

/** Quiz answer options are serialized locally to keep auto-grading deterministic and independent of third-party assessment services. */
export const academyQuizQuestions = mysqlTable("academy_quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("optionsJson").notNull(),
  correctOption: int("correctOption").notNull(),
  explanation: text("explanation").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
}, table => [index("academy_quiz_questions_lesson_idx").on(table.lessonId)]);

export const academyFlashcards = mysqlTable("academy_flashcards", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
}, table => [index("academy_flashcards_lesson_idx").on(table.lessonId)]);

/** Course-level progress supports the learner dashboard and manager oversight. */
export const academyCourseProgress = mysqlTable("academy_course_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "complete"]).default("not_started").notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  lastLessonId: int("lastLessonId"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [unique("academy_course_progress_user_course_uq").on(table.userId, table.courseId), index("academy_course_progress_course_idx").on(table.courseId)]);

export const academyLessonProgress = mysqlTable("academy_lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  isComplete: boolean("isComplete").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [unique("academy_lesson_progress_user_lesson_uq").on(table.userId, table.lessonId), index("academy_lesson_progress_lesson_idx").on(table.lessonId)]);

export const academyQuizAttempts = mysqlTable("academy_quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  answersJson: text("answersJson").notNull(),
  scorePercent: int("scorePercent").notNull(),
  correctCount: int("correctCount").notNull(),
  questionCount: int("questionCount").notNull(),
  isPassed: boolean("isPassed").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
}, table => [index("academy_quiz_attempts_user_lesson_idx").on(table.userId, table.lessonId)]);

/** Badge definitions are reusable accomplishments; awards retain a durable learner record. */
export const academyBadges = mysqlTable("academy_badges", {
  id: int("id").autoincrement().primaryKey(),
  badgeKey: varchar("badgeKey", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  courseId: int("courseId"),
  accent: varchar("accent", { length: 24 }).default("mint").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const academyUserBadges = mysqlTable("academy_user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
}, table => [unique("academy_user_badges_user_badge_uq").on(table.userId, table.badgeId)]);

/** The manager-owned reminder schedule is persisted by platform task UID for secure scheduled callback lookup. */
export const academyReminderSchedules = mysqlTable("academy_reminder_schedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  cron: varchar("cron", { length: 80 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("academy_reminders_task_uid_idx").on(table.scheduleCronTaskUid)]);

/** Chat conversations connect operators around direct coordination or named group workspaces. */
export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["direct", "group"]).notNull(),
  /** Canonical pair key for a direct conversation; group conversations leave this empty. */
  directKey: varchar("directKey", { length: 64 }).unique(),
  title: varchar("title", { length: 120 }),
  /** Temporary groups stay readable but become conversation-wide archived records after expiry. */
  isTemporary: boolean("isTemporary").default(false).notNull(),
  contextLabel: varchar("contextLabel", { length: 160 }),
  clientId: int("clientId"),
  expiresAt: timestamp("expiresAt"),
  archivedAt: timestamp("archivedAt"),
  archiveReason: mysqlEnum("archiveReason", ["expired", "manual"]),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("chat_conversations_activity_idx").on(table.updatedAt), index("chat_conversations_expiry_idx").on(table.isTemporary, table.expiresAt, table.archivedAt)]);

/** One project-owned Heartbeat schedule archives expired temporary chat groups in a bounded, idempotent sweep. */
export const temporaryThreadArchiveSchedules = mysqlTable("temporary_thread_archive_schedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  cron: varchar("cron", { length: 80 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("temporary_thread_archives_task_uid_idx").on(table.scheduleCronTaskUid)]);

/** Conversation membership owns read state and private inbox controls for every operator. */
export const chatConversationMembers = mysqlTable("chat_conversation_members", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  lastReadMessageId: int("lastReadMessageId"),
  pinnedAt: timestamp("pinnedAt"),
  archivedAt: timestamp("archivedAt"),
  mutedUntil: timestamp("mutedUntil"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, table => [
  unique("chat_members_conversation_user_uq").on(table.conversationId, table.userId),
  index("chat_members_user_inbox_idx").on(table.userId, table.archivedAt, table.pinnedAt),
  index("chat_members_conversation_idx").on(table.conversationId),
]);

/** Messages are durable operational coordination records. File bytes remain outside MySQL and are intentionally out of scope for this initial chat pass. */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  authorUserId: int("authorUserId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  editedAt: timestamp("editedAt"),
}, table => [
  index("chat_messages_conversation_created_idx").on(table.conversationId, table.createdAt),
  index("chat_messages_author_idx").on(table.authorUserId),
]);

/** Each operator can apply one of a given emoji to a message; aggregate counts are calculated when the thread loads. */
export const chatMessageReactions = mysqlTable("chat_message_reactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  emoji: varchar("emoji", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  unique("chat_reactions_message_user_emoji_uq").on(table.messageId, table.userId, table.emoji),
  index("chat_reactions_message_idx").on(table.messageId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
