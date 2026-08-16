import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
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
    idxAssignee: index('idx_task_assignee').on(table.assigneeId),
    idxStatus: index('idx_task_status').on(table.status),
  }),
)
