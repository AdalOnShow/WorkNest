-- Move the legacy single assignee into the task_assignee join table.
INSERT OR IGNORE INTO `task_assignee` (`task_id`, `user_id`, `created_at`)
SELECT `id`, `assignee_id`, `created_at` FROM `task` WHERE `assignee_id` IS NOT NULL;
