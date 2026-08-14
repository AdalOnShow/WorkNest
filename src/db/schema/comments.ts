import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { task } from './tasks'
import { user } from './auth'

export const comment = sqliteTable(
  'comment',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id').notNull().references(() => task.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    idxTask: index('idx_comment_task').on(table.taskId),
  }),
)
