import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
  primaryKey,
} from 'drizzle-orm/sqlite-core'
import { project } from './projects'
import { user } from './auth'

export const task = sqliteTable(
  'task',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'] })
      .notNull()
      .default('TODO'),
    priority: text('priority', { enum: ['HIGH', 'MEDIUM', 'LOW'] })
      .notNull()
      .default('MEDIUM'),
    /**
     * Deprecated: replaced by `task_assignee`, read and written nowhere.
     * Kept because dropping it needs a table rebuild, and on D1 rebuilding
     * `task` would cascade-delete its comments and assignees.
     */
    assigneeId: text('assignee_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    deadline: integer('deadline', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
  },
  (table) => ({
    uniqueProjectTitle: unique('unique_project_title').on(
      table.projectId,
      table.title,
    ),
    idxProject: index('idx_task_project').on(table.projectId),
    // Deadline filters (overdue / this week) and upcoming-deadline lists.
    idxProjectDeadline: index('idx_task_project_deadline').on(
      table.projectId,
      table.deadline,
    ),
    idxStatus: index('idx_task_status').on(table.status),
    // Dashboard KPIs and the completed-per-day chart filter by project + status.
    idxProjectStatusCompleted: index('idx_task_project_status_completed').on(
      table.projectId,
      table.status,
      table.completedAt,
    ),
  }),
)

export const taskAssignee = sqliteTable(
  'task_assignee',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => task.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.userId] }),
    idxUser: index('idx_task_assignee_user').on(table.userId),
  }),
)
