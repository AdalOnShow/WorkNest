CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
-- Hand-edited: memberships whose user was deleted (user_id set to NULL by the
-- old ON DELETE SET NULL) are dropped so the NOT NULL copy below succeeds.
-- Rebuilding project_member is safe on D1 (foreign keys stay enforced) because
-- no table references it, so the DROP cascades nowhere.
DELETE FROM `project_member` WHERE `user_id` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_project_member` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'TEAM_MEMBER' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_project_member`("id", "project_id", "user_id", "role", "created_at") SELECT "id", "project_id", "user_id", "role", "created_at" FROM `project_member`;--> statement-breakpoint
DROP TABLE `project_member`;--> statement-breakpoint
ALTER TABLE `__new_project_member` RENAME TO `project_member`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_project_member_project` ON `project_member` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_member_user` ON `project_member` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_project_user` ON `project_member` (`project_id`,`user_id`);--> statement-breakpoint
DROP INDEX `idx_project_invitation_token`;--> statement-breakpoint
DROP INDEX `idx_task_assignee`;--> statement-breakpoint
CREATE INDEX `idx_task_project_deadline` ON `task` (`project_id`,`deadline`);--> statement-breakpoint
DROP INDEX `idx_comment_task`;--> statement-breakpoint
CREATE INDEX `idx_comment_task_created` ON `comment` (`task_id`,`created_at`);--> statement-breakpoint
DROP INDEX `idx_notification_recipient`;--> statement-breakpoint
CREATE INDEX `idx_notification_recipient_read_created` ON `notification` (`recipient_id`,`read`,`created_at`);--> statement-breakpoint
DROP INDEX `idx_activity_project`;--> statement-breakpoint
CREATE INDEX `idx_activity_project_created` ON `activity` (`project_id`,`created_at`);