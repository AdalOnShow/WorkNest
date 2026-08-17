import { createDb } from '#/db'
import { user, userProfile } from '#/db/schema'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, count, eq, sql } from 'drizzle-orm'

function getDb() {
  const env = getCloudflareEnv()
  return createDb(env.DB)
}

function getAuth() {
  const env = getCloudflareEnv()
  return createAuth(env)
}

async function requireSession() {
  const request = getRequest()
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')
}

export const listMembers = createServerFn({ method: 'GET' })
  .validator((data: { search?: string; page?: number; pageSize?: number }) => ({
    search: data.search,
    page: Math.max(1, Math.floor(data.page || 1)),
    pageSize: Math.min(100, Math.max(1, Math.floor(data.pageSize || 10))),
  }))
  .handler(async ({ data }) => {
    await requireSession()
    const db = getDb()
    const search = data.search || ''
    const page = data.page
    const pageSize = data.pageSize

    const conditions = []
    if (search) {
      conditions.push(
        sql`(${user.name} LIKE ${`%${search}%`} OR ${user.email} LIKE ${`%${search}%`})`,
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [members, countResult] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: userProfile.role,
          createdAt: user.createdAt,
        })
        .from(user)
        .leftJoin(userProfile, eq(user.id, userProfile.id))
        .where(where)
        .orderBy(user.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(user).where(where),
    ])

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items: members, total, totalPages, page }
  })
