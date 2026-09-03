ALTER TABLE `notifications` ADD `priority` enum('high','medium','low') DEFAULT 'medium' NOT NULL;--> statement-breakpoint
CREATE INDEX `notifications_priority_idx` ON `notifications` (`priority`);