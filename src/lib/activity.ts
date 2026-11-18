import type { Database } from '#/db'
import { activity, notification } from '#/db/schema'

/**
 * Activity logging and notification creation.
 *
 * Both write to D1 only. Notifications reach the UI through TanStack Query
 * refetches, not WebSockets. Both helpers swallow and log their own errors so
 * a failed audit or notification write never fails the primary mutation.
 */

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_MEMBER_INVITED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_ASSIGNED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'

export type ActivityEntityType = 'project' | 'task' | 'member' | 'comment'

export type NotificationType = (typeof notification.type.enumValues)[number]

export interface LogActivityParams {
  db: Database
  actorId?: string | null
  projectId: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string
  metadata?: Record<string, unknown> | null
}

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
      actorId: actorId ?? null,
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

export interface NotifyUsersParams {
  db: Database
  /** The user who caused the event. Never notified about their own action. */
  actorId: string
  /** Candidate recipients. Null/undefined entries and duplicates are dropped. */
  recipientIds: ReadonlyArray<string | null | undefined>
  type: NotificationType
  title: string
  message: string
  referenceId?: string | null
}

export async function notifyUsers({
  db,
  actorId,
  recipientIds,
  type,
  title,
  message,
  referenceId,
}: NotifyUsersParams): Promise<void> {
  const recipients = [
    ...new Set(
      recipientIds.filter(
        (id): id is string => typeof id === 'string' && id !== actorId,
      ),
    ),
  ]
  if (recipients.length === 0) return

  const createdAt = new Date()
  try {
    await db.insert(notification).values(
      recipients.map((recipientId) => ({
        id: crypto.randomUUID(),
        recipientId,
        type,
        title,
        message,
        referenceId: referenceId ?? null,
        read: false,
        createdAt,
      })),
    )
  } catch (err) {
    console.error('[notifyUsers] Failed to create notifications:', err)
  }
}
