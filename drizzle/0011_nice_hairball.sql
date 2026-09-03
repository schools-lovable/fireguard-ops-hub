CREATE TABLE `site_location_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`previousLatitude` decimal(10,7),
	`previousLongitude` decimal(10,7),
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`source` enum('manual','gps_capture','geocoded') NOT NULL,
	`accuracyMeters` decimal(8,2),
	`capturedByUserId` int NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_location_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sites` ADD `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `sites` ADD `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `sites` ADD `locationSource` enum('manual','gps_capture','geocoded') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `sites` ADD `locationCapturedBy` varchar(191);--> statement-breakpoint
ALTER TABLE `sites` ADD `locationCapturedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sites` ADD `locationAccuracyMeters` decimal(8,2);--> statement-breakpoint
CREATE INDEX `site_location_history_site_idx` ON `site_location_history` (`siteId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `sites_location_idx` ON `sites` (`latitude`,`longitude`);