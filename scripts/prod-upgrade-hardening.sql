-- One-time upgrade for the PRODUCTION D1 after the hardening schema changes
-- were squashed into migrations/0000_version_1.sql.
--
-- Production already records 0000_version_1.sql as applied, so `pnpm deploy`
-- will not apply these changes. This file brings production to the same schema
-- as a fresh 0000_version_1.sql (verified table-by-table and index-by-index
-- locally). The migration history needs no change.
--
-- Run ONCE, BEFORE deploying the code that needs it (Better Auth's rate
-- limiter reads the `rate_limit` table on sign-in):
--   pnpm wrangler d1 migrations list worknest-db --remote
--     -> must report no migrations to apply (0000_version_1.sql applied)
--   pnpm wrangler d1 export worknest-db --remote --output prod-backup.sql
--   pnpm wrangler d1 execute worknest-db --remote --file scripts/prod-upgrade-hardening.sql
--
-- Running it a second time fails on CREATE TABLE `rate_limit` and changes nothing.
--
-- project_member is rebuilt to make user_id NOT NULL + ON DELETE CASCADE.
-- That is safe on D1 (foreign keys stay enforced) only because no table
-- references project_member, so the DROP cascades nowhere.

CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);

CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);
DELETE FROM `project_member` WHERE `user_id` IS NULL;
CREATE TABLE `__new_project_member` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'TEAM_MEMBER' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `__new_project_member`("id", "project_id", "user_id", "role", "created_at") SELECT "id", "project_id", "user_id", "role", "created_at" FROM `project_member`;
DROP TABLE `project_member`;
ALTER TABLE `__new_project_member` RENAME TO `project_member`;
CREATE INDEX `idx_project_member_project` ON `project_member` (`project_id`);
CREATE INDEX `idx_project_member_user` ON `project_member` (`user_id`);
CREATE UNIQUE INDEX `unique_project_user` ON `project_member` (`project_id`,`user_id`);
DROP INDEX `idx_project_invitation_token`;
DROP INDEX `idx_task_assignee`;
CREATE INDEX `idx_task_project_deadline` ON `task` (`project_id`,`deadline`);
DROP INDEX `idx_comment_task`;
CREATE INDEX `idx_comment_task_created` ON `comment` (`task_id`,`created_at`);
DROP INDEX `idx_notification_recipient`;
CREATE INDEX `idx_notification_recipient_read_created` ON `notification` (`recipient_id`,`read`,`created_at`);
DROP INDEX `idx_activity_project`;
CREATE INDEX `idx_activity_project_created` ON `activity` (`project_id`,`created_at`);
