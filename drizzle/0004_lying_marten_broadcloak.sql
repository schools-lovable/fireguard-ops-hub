CREATE TABLE `presence_alert_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerUserId` int NOT NULL,
	`alertFieldTeam` boolean NOT NULL DEFAULT false,
	`alertReviewers` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presence_alert_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `presence_alert_preferences_managerUserId_unique` UNIQUE(`managerUserId`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `kind` enum('digest','overdue','assignment','report','presence') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentRoute` varchar(160);