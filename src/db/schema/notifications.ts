import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const notification = sqliteTable(
  'notification',
  {
    id: text('id').primaryKey(),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'TASK_ASSIGNED',
        'TASK_STATUS_UPDATED',
        'TASK_DUE_SOON',
        'TASK_COMMENT_ADDED',
      ],
    }).notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    referenceId: text('reference_id'),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    // Bell (unread count) and the paginated list, newest first.
    idxRecipientReadCreated: index(
      'idx_notification_recipient_read_created',
    ).on(table.recipientId, table.read, table.createdAt),
  }),
)
