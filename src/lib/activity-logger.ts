import { createDb } from '#/db'
import { activity } from '#/db/schema'

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_ASSIGNED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'

export interface LogActivityParams {
  db: ReturnType<typeof createDb>
  actorId?: string | null
  projectId: string
  action: ActivityAction | string
  entityType: 'project' | 'task' | 'member' | 'comment' | 'attachment'
  entityId: string
  metadata?: Record<string, unknown> | null
}

/**
 * Server helper to record audit activity across projects, tasks, and members.
 * Fails safely without blowing up the primary business transaction if non-critical.
 */
export async function logActivity({
  db,
  actorId,
  projectId,
  action,
  entityType,
  entityId,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    await db.insert(activity).values({
      id: crypto.randomUUID(),
      actorId: actorId || null,
      projectId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[logActivity] Failed to record activity:', err)
  }
}
