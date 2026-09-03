ALTER TABLE `notifications` ADD `dedupeKey` varchar(120);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_dedupeKey_unique` UNIQUE(`dedupeKey`);