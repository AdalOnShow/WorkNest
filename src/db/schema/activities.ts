import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const activity = sqliteTable(
  'activity',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').notNull(),
    projectId: text('project_id').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    idxProject: index('idx_activity_project').on(table.projectId),
  }),
)
