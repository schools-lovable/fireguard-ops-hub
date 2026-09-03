ALTER TABLE `users` ADD `lastActiveAt` timestamp;--> statement-breakpoint
CREATE INDEX `users_last_active_at_idx` ON `users` (`lastActiveAt`);