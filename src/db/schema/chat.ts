import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { project } from './projects'

/**
 * Project chat messages. One room per project; messages are immutable
 * (no edits) and hard-deleted by the author or a project ADMIN.
 *
 * createdAt uses millisecond precision so keyset pagination on
 * (createdAt, id) keeps a stable order for messages sent in the same second.
 */
export const chatMessage = sqliteTable(
  'chat_message',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    idxProjectCreated: index('idx_chat_message_project_created').on(
      table.projectId,
      table.createdAt,
      table.id,
    ),
  }),
)
