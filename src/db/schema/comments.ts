import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const comment = sqliteTable(
  'comment',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id').notNull(),
    authorId: text('author_id').notNull(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    idxTask: index('idx_comment_task').on(table.taskId),
  }),
)
