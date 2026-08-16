import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { task } from './tasks'
import { user } from './auth'

export const attachment = sqliteTable(
  'attachment',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => task.id, { onDelete: 'cascade' }),
    uploaderId: text('uploader_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    fileName: text('file_name').notNull(),
    objectKey: text('object_key').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    idxTask: index('idx_attachment_task').on(table.taskId),
  }),
)
