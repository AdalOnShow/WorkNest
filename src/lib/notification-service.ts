import { createDb } from '#/db'
import { notification } from '#/db/schema'

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_DUE_SOON'

export interface CreateNotificationParams {
  db: ReturnType<typeof createDb>
  recipientId: string
  type: NotificationType
  title: string
  message: string
  referenceId?: string | null
}

/**
 * Server helper to dispatch a notification to a specific user.
 * Silently catches errors to avoid failing primary user flows.
 */
export async function createNotification({
  db,
  recipientId,
  type,
  title,
  message,
  referenceId,
}: CreateNotificationParams): Promise<void> {
  try {
    await db.insert(notification).values({
      id: crypto.randomUUID(),
      recipientId,
      type,
      title,
      message,
      referenceId: referenceId || null,
      read: false,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[createNotification] Failed to create notification:', err)
  }
}
