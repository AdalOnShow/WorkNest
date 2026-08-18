import type { createDb } from '#/db'
import { activity } from '#/db/schema'
import { getCloudflareEnv } from '#/lib/request-context'
import { waitUntil } from 'cloudflare:workers'

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
  const activityId = crypto.randomUUID()
  try {
    await db.insert(activity).values({
      id: activityId,
      actorId: actorId || null,
      projectId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    })

    try {
      const env = getCloudflareEnv() as Env & { ACTIVITY_DO: DurableObjectNamespace }
      const stub = env.ACTIVITY_DO.idFromName(projectId)
      const doStub = env.ACTIVITY_DO.get(stub) as unknown as {
        broadcastActivity: (event: {
          type: string
          payload: {
            activityId: string
            projectId: string
            actorId: string
            action: string
            entityType: string
            entityId: string
            metadata?: string
          }
        }) => Promise<void>
      }
      waitUntil(
        doStub.broadcastActivity({
          type: 'ACTIVITY_CREATED',
          payload: {
            activityId,
            projectId,
            actorId: actorId || '',
            action,
            entityType,
            entityId,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
          },
        }).catch((err) => {
          console.error('[logActivity] Failed to broadcast via DO:', err)
        }),
      )
    } catch (err) {
      console.error('[logActivity] Failed to broadcast via DO:', err)
    }
  } catch (err) {
    console.error('[logActivity] Failed to record activity:', err)
  }
}
