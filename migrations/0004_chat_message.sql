CREATE TABLE `chat_message` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`sender_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_chat_message_project_created` ON `chat_message` (`project_id`,`created_at`,`id`);