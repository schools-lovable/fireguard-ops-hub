CREATE TABLE `employee_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeId` varchar(64),
	`phone` varchar(40),
	`title` varchar(120),
	`photoUrl` varchar(500),
	`locationNames` text,
	`employmentStatus` enum('active','on_leave','terminated') NOT NULL DEFAULT 'active',
	`hireDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `profile_access_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`changedByUserId` int NOT NULL,
	`eventType` enum('profile_updated','preferences_updated','pin_reset','permission_changed') NOT NULL,
	`detail` varchar(240) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profile_access_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_certifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`authority` varchar(160),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notifyAssignments` boolean NOT NULL DEFAULT true,
	`notifyExceptions` boolean NOT NULL DEFAULT true,
	`notifyLearning` boolean NOT NULL DEFAULT true,
	`language` varchar(12) NOT NULL DEFAULT 'en-US',
	`pinHash` varchar(255),
	`pinUpdatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `profile_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clockedInAt` timestamp NOT NULL DEFAULT (now()),
	`clockedOutAt` timestamp,
	`source` varchar(40) NOT NULL DEFAULT 'profile',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `employee_profiles_status_idx` ON `employee_profiles` (`employmentStatus`);--> statement-breakpoint
CREATE INDEX `profile_access_audits_user_idx` ON `profile_access_audits` (`userId`);--> statement-breakpoint
CREATE INDEX `profile_access_audits_created_idx` ON `profile_access_audits` (`createdAt`);--> statement-breakpoint
CREATE INDEX `profile_certifications_user_idx` ON `profile_certifications` (`userId`);--> statement-breakpoint
CREATE INDEX `profile_certifications_expiry_idx` ON `profile_certifications` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `time_entries_user_clock_in_idx` ON `time_entries` (`userId`,`clockedInAt`);--> statement-breakpoint
CREATE INDEX `time_entries_user_clock_out_idx` ON `time_entries` (`userId`,`clockedOutAt`);