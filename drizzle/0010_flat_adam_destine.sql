CREATE TABLE `temporary_thread_archive_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`cron` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `temporary_thread_archive_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `temporary_thread_archive_schedules_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `isTemporary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `contextLabel` varchar(160);--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `clientId` int;--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD `archiveReason` enum('expired','manual');--> statement-breakpoint
CREATE INDEX `temporary_thread_archives_task_uid_idx` ON `temporary_thread_archive_schedules` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `chat_conversations_expiry_idx` ON `chat_conversations` (`isTemporary`,`expiresAt`,`archivedAt`);
