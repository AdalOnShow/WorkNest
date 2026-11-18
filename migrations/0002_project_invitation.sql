CREATE TABLE `project_invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`role` text DEFAULT 'TEAM_MEMBER' NOT NULL,
	`invited_by` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_invitation_token_unique` ON `project_invitation` (`token`);--> statement-breakpoint
CREATE INDEX `idx_project_invitation_project` ON `project_invitation` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_invitation_email` ON `project_invitation` (`email`);--> statement-breakpoint
CREATE INDEX `idx_project_invitation_token` ON `project_invitation` (`token`);--> statement-breakpoint
CREATE INDEX `idx_project_invitation_status` ON `project_invitation` (`status`);