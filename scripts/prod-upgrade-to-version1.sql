-- One-time upgrade for the PRODUCTION D1 after migrations were squashed into
-- migrations/0000_version_1.sql.
--
-- Production had applied the old 0000–0005 migrations. This file applies what
-- the old 0006–0009 did, then rewrites the migration history so wrangler sees
-- 0000_version_1.sql as already applied. The resulting schema is identical to
-- a fresh 0000_version_1.sql (verified column-by-column locally).
--
-- Run ONCE, before the next `pnpm deploy`:
--   pnpm wrangler d1 migrations list worknest-db --remote
--     -> must list exactly 0006_true_mantis … 0009_task_project_status_index
--   pnpm wrangler d1 export worknest-db --remote --output prod-backup.sql
--   pnpm wrangler d1 execute worknest-db --remote --file scripts/prod-upgrade-to-version1.sql
--
-- Running it a second time fails on CREATE TABLE and changes nothing.

-- old 0006: multi-assignee join table
CREATE TABLE `task_assignee` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_task_assignee_user` ON `task_assignee` (`user_id`);

-- old 0007: move the legacy single assignee into the join table
INSERT OR IGNORE INTO `task_assignee` (`task_id`, `user_id`, `created_at`)
SELECT `id`, `assignee_id`, `created_at` FROM `task` WHERE `assignee_id` IS NOT NULL;

-- old 0008: password hashes for email/password accounts
ALTER TABLE `account` ADD `password` text;

-- old 0009: dashboard query index
CREATE INDEX `idx_task_project_status_completed` ON `task` (`project_id`,`status`,`completed_at`);

-- Migration history now matches the squashed migrations folder.
DELETE FROM `d1_migrations`;
INSERT INTO `d1_migrations` (`name`) VALUES ('0000_version_1.sql');
