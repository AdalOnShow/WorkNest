import { createDb } from '#/db'
import { notification } from '#/db/schema'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, count, desc, eq } from 'drizzle-orm'

function getDb() {
  const env = getCloudflareEnv()
  return createDb(env.DB)
}

function getAuth() {
  const env = getCloudflareEnv()
  return createAuth(env)
}

async function requireUserId() {
  const request = getRequest()
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')
  return session.user.id
}

export const listNotifications = createServerFn({ method: 'GET' })
  .validator((data: { page?: number; pageSize?: number }) => ({
    page: Math.max(1, Math.floor(data.page || 1)),
    pageSize: Math.min(100, Math.max(1, Math.floor(data.pageSize || 20))),
  }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const page = data.page
    const pageSize = data.pageSize

    const where = eq(notification.recipientId, userId)

    const [notifications, countResult, unreadResult] = await Promise.all([
      db
        .select()
        .from(notification)
        .where(where)
        .orderBy(desc(notification.createdAt))
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
  .validator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()

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
}).handler(async () => {
  const userId = await requireUserId()
  const db = getDb()

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
