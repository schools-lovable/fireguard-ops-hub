CREATE TABLE `academy_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`badgeKey` varchar(100) NOT NULL,
	`title` varchar(140) NOT NULL,
	`description` text NOT NULL,
	`courseId` int,
	`accent` varchar(24) NOT NULL DEFAULT 'mint',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_badges_badgeKey_unique` UNIQUE(`badgeKey`)
);
--> statement-breakpoint
CREATE TABLE `academy_course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`status` enum('not_started','in_progress','complete') NOT NULL DEFAULT 'not_started',
	`progressPercent` int NOT NULL DEFAULT 0,
	`lastLessonId` int,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_course_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_course_progress_user_course_uq` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
CREATE TABLE `academy_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`category` varchar(90) NOT NULL,
	`level` enum('foundation','intermediate','advanced') NOT NULL DEFAULT 'foundation',
	`estimatedMinutes` int NOT NULL DEFAULT 0,
	`requiredRole` enum('all','field','reviewer','manager') NOT NULL DEFAULT 'all',
	`isPublished` boolean NOT NULL DEFAULT true,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `academy_flashcards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `academy_flashcards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`isComplete` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_lesson_progress_user_lesson_uq` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `academy_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`lessonType` enum('video','reading','quiz','flashcards') NOT NULL,
	`body` text NOT NULL,
	`videoUrl` varchar(500),
	`durationMinutes` int NOT NULL DEFAULT 5,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`answersJson` text NOT NULL,
	`scorePercent` int NOT NULL,
	`correctCount` int NOT NULL,
	`questionCount` int NOT NULL,
	`isPassed` boolean NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`prompt` text NOT NULL,
	`optionsJson` text NOT NULL,
	`correctOption` int NOT NULL,
	`explanation` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `academy_quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_reminder_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`cron` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_reminder_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_user_badges_user_badge_uq` UNIQUE(`userId`,`badgeId`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `kind` enum('digest','overdue','assignment','report','presence','learning') NOT NULL;--> statement-breakpoint
CREATE INDEX `academy_course_progress_course_idx` ON `academy_course_progress` (`courseId`);--> statement-breakpoint
CREATE INDEX `academy_courses_published_idx` ON `academy_courses` (`isPublished`);--> statement-breakpoint
CREATE INDEX `academy_flashcards_lesson_idx` ON `academy_flashcards` (`lessonId`);--> statement-breakpoint
CREATE INDEX `academy_lesson_progress_lesson_idx` ON `academy_lesson_progress` (`lessonId`);--> statement-breakpoint
CREATE INDEX `academy_lessons_course_idx` ON `academy_lessons` (`courseId`);--> statement-breakpoint
CREATE INDEX `academy_lessons_course_order_idx` ON `academy_lessons` (`courseId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `academy_quiz_attempts_user_lesson_idx` ON `academy_quiz_attempts` (`userId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `academy_quiz_questions_lesson_idx` ON `academy_quiz_questions` (`lessonId`);--> statement-breakpoint
CREATE INDEX `academy_reminders_task_uid_idx` ON `academy_reminder_schedules` (`scheduleCronTaskUid`);