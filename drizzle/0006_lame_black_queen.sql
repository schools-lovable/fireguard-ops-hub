CREATE TABLE `extinguisher_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`serialNumber` varchar(128) NOT NULL,
	`extinguisherType` varchar(64) NOT NULL,
	`capacityKg` varchar(16) NOT NULL,
	`classification` varchar(64) NOT NULL,
	`manufactureDate` timestamp NOT NULL,
	`installDate` timestamp,
	`lastServiceDate` timestamp,
	`nextServiceDue` timestamp,
	`hydrostaticTestDue` timestamp,
	`status` enum('in_service','due','overdue','retired') NOT NULL DEFAULT 'in_service',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extinguisher_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `extinguisher_units_serialNumber_unique` UNIQUE(`serialNumber`)
);
--> statement-breakpoint
CREATE TABLE `service_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateCode` varchar(40) NOT NULL,
	`clientId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`issuedByUserId` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `service_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_certificates_certificateCode_unique` UNIQUE(`certificateCode`),
	CONSTRAINT `service_certificates_workOrderId_unique` UNIQUE(`workOrderId`)
);
--> statement-breakpoint
CREATE TABLE `service_checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`unitId` int NOT NULL,
	`confirmedType` varchar(64),
	`confirmedCapacityKg` varchar(16),
	`confirmedClassification` varchar(64),
	`specificationMismatch` boolean NOT NULL DEFAULT false,
	`gaugePressureOk` boolean,
	`sealIntact` boolean,
	`pinPresent` boolean,
	`hoseNozzleOk` boolean,
	`mountingOk` boolean,
	`weightOk` boolean,
	`tagAttached` boolean,
	`notes` text,
	`completed` boolean NOT NULL DEFAULT false,
	`completedByUserId` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_checklist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_checklist_work_order_unit_uq` UNIQUE(`workOrderId`,`unitId`)
);
--> statement-breakpoint
CREATE TABLE `service_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`unitId` int NOT NULL,
	`phase` enum('before','after') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`isFlagged` boolean NOT NULL DEFAULT false,
	`flagReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_work_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`previousStatus` varchar(32),
	`nextStatus` varchar(32) NOT NULL,
	`previousReviewStatus` varchar(32),
	`nextReviewStatus` varchar(32),
	`reason` text,
	`changedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_work_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','field','reviewer','manager','admin','technician','sales','finance') NOT NULL DEFAULT 'field';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `jobCode` varchar(40);--> statement-breakpoint
ALTER TABLE `work_orders` ADD `clientId` int;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `reviewStatus` enum('pending_review','approved','flagged');--> statement-breakpoint
ALTER TABLE `work_orders` ADD `evidenceStatus` enum('not_started','ready','flagged','blocked') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `visitType` enum('service','refill','service_refill','replacement') DEFAULT 'service' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `comments` text;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `reviewedByUserId` int;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `certificateReady` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `certificateBlockReason` text;--> statement-breakpoint
CREATE INDEX `extinguisher_units_site_idx` ON `extinguisher_units` (`siteId`);--> statement-breakpoint
CREATE INDEX `extinguisher_units_due_idx` ON `extinguisher_units` (`nextServiceDue`);--> statement-breakpoint
CREATE INDEX `service_checklist_work_order_idx` ON `service_checklist_items` (`workOrderId`);--> statement-breakpoint
CREATE INDEX `service_evidence_work_order_idx` ON `service_evidence` (`workOrderId`);--> statement-breakpoint
CREATE INDEX `service_work_history_work_order_idx` ON `service_work_history` (`workOrderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `work_orders_review_status_idx` ON `work_orders` (`reviewStatus`);