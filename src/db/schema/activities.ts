import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { project } from './projects'

export const activity = sqliteTable(
  'activity',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    // Recent-activity feeds, newest first per project.
    idxProjectCreated: index('idx_activity_project_created').on(
      table.projectId,
      table.createdAt,
    ),
  }),
)
