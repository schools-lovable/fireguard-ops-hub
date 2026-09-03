CREATE TABLE `chat_conversation_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`lastReadMessageId` int,
	`pinnedAt` timestamp,
	`archivedAt` timestamp,
	`mutedUntil` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_conversation_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_members_conversation_user_uq` UNIQUE(`conversationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('direct','group') NOT NULL,
	`directKey` varchar(64),
	`title` varchar(120),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_conversations_directKey_unique` UNIQUE(`directKey`)
);
--> statement-breakpoint
CREATE TABLE `chat_message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_reactions_message_user_emoji_uq` UNIQUE(`messageId`,`userId`,`emoji`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`editedAt` timestamp,
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `chat_members_user_inbox_idx` ON `chat_conversation_members` (`userId`,`archivedAt`,`pinnedAt`);--> statement-breakpoint
CREATE INDEX `chat_members_conversation_idx` ON `chat_conversation_members` (`conversationId`);--> statement-breakpoint
CREATE INDEX `chat_conversations_activity_idx` ON `chat_conversations` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `chat_reactions_message_idx` ON `chat_message_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `chat_messages_conversation_created_idx` ON `chat_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_messages_author_idx` ON `chat_messages` (`authorUserId`);