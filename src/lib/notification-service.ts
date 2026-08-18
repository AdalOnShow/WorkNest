import type { createDb } from '#/db'
import { notification } from '#/db/schema'
import { getCloudflareEnv } from '#/lib/request-context'

export type NotificationType =
  'TASK_ASSIGNED' | 'TASK_STATUS_UPDATED' | 'TASK_DUE_SOON' | 'TASK_COMMENT_ADDED'

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
  const notificationId = crypto.randomUUID()
  try {
    await db.insert(notification).values({
      id: notificationId,
      recipientId,
      type,
      title,
      message,
      referenceId: referenceId || null,
      read: false,
      createdAt: new Date(),
    })

    try {
      const env = getCloudflareEnv() as Env & { NOTIFICATION_DO: DurableObjectNamespace }
      const stub = env.NOTIFICATION_DO.idFromName(recipientId)
      const doStub = env.NOTIFICATION_DO.get(stub) as unknown as {
        sendNotification(event: {
          type: string
          payload: { notificationId: string; recipientId: string; title: string; message: string }
        }): Promise<void>
      }
      await doStub.sendNotification({
        type: 'NOTIFICATION_CREATED',
        payload: {
          notificationId,
          recipientId,
          title,
          message,
        },
      })
    } catch (err) {
      console.error('[createNotification] Failed to push via DO:', err)
    }
  } catch (err) {
    console.error('[createNotification] Failed to create notification:', err)
  }
}
