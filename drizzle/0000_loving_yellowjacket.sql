CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`portfolioOwnerName` varchar(120) NOT NULL,
	`readinessStatus` enum('ready','review','risk') NOT NULL DEFAULT 'review',
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`workOrderId` int,
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`severity` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`ownerUserId` int,
	`dueAt` timestamp,
	`resolvedAt` timestamp,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`cron` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int,
	`sourceExceptionId` int,
	`kind` enum('digest','overdue','assignment','report') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(260) NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestedByUserId` int NOT NULL,
	`reportType` enum('readiness','service','exceptions') NOT NULL,
	`rowCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`address` varchar(240) NOT NULL,
	`readinessStatus` enum('ready','review','risk') NOT NULL DEFAULT 'review',
	`nextInspectionAt` timestamp,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('field','reviewer','manager','admin') NOT NULL DEFAULT 'field',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`workType` varchar(100) NOT NULL,
	`status` enum('scheduled','in_progress','awaiting_review','blocked','complete') NOT NULL DEFAULT 'scheduled',
	`evidenceProgress` int NOT NULL DEFAULT 0,
	`scheduledFor` timestamp NOT NULL,
	`dueAt` timestamp,
	`assignedUserId` int,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `clients_readiness_status_idx` ON `clients` (`readinessStatus`);--> statement-breakpoint
CREATE INDEX `exceptions_site_id_idx` ON `exceptions` (`siteId`);--> statement-breakpoint
CREATE INDEX `exceptions_status_idx` ON `exceptions` (`status`);--> statement-breakpoint
CREATE INDEX `exceptions_due_at_idx` ON `exceptions` (`dueAt`);--> statement-breakpoint
CREATE INDEX `notification_schedule_task_uid_idx` ON `notification_schedules` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipientUserId`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `sites_client_id_idx` ON `sites` (`clientId`);--> statement-breakpoint
CREATE INDEX `sites_readiness_status_idx` ON `sites` (`readinessStatus`);--> statement-breakpoint
CREATE INDEX `work_orders_site_id_idx` ON `work_orders` (`siteId`);--> statement-breakpoint
CREATE INDEX `work_orders_status_idx` ON `work_orders` (`status`);--> statement-breakpoint
CREATE INDEX `work_orders_scheduled_for_idx` ON `work_orders` (`scheduledFor`);