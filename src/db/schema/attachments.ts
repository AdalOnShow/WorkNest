import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const attachment = sqliteTable(
  'attachment',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id').notNull(),
    uploaderId: text('uploader_id').notNull(),
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
