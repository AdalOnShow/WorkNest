import { notification } from '#/db/schema'
import { authMiddleware, rateLimitMiddleware } from '#/lib/middleware'
import { idSchema, paginationSchema, input } from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

export const listNotifications = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(input(z.object(paginationSchema(20))))
  .handler(async ({ data, context: { db, userId } }) => {
    const page = data.page
    const pageSize = data.pageSize

    const where = eq(notification.recipientId, userId)

    const [notifications, countResult, unreadResult] = await Promise.all([
      db
        .select()
        .from(notification)
        .where(where)
        .orderBy(desc(notification.createdAt), desc(notification.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(notification).where(where),
      db
        .select({ count: count() })
        .from(notification)
        .where(and(where, eq(notification.read, false))),
    ])

    const items = notifications.map((n) => ({
      ...n,
      timeAgo: getTimeAgo(n.createdAt),
    }))

    return {
      items,
      total: countResult[0]?.count || 0,
      unreadCount: unreadResult[0]?.count || 0,
      totalPages: Math.ceil((countResult[0]?.count || 0) / pageSize),
      page,
    }
  })

export const markNotificationRead = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ notificationId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.id, data.notificationId),
          eq(notification.recipientId, userId),
        ),
      )

    return { success: true }
  })

export const markAllNotificationsRead = createServerFn({
  method: 'POST',
})
  .middleware([rateLimitMiddleware])
  .handler(async ({ context: { db, userId } }) => {
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(eq(notification.recipientId, userId), eq(notification.read, false)),
      )

    return { success: true }
  })

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
