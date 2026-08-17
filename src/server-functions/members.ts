import { createServerFn } from '@tanstack/react-start'
import { eq, count, and, sql } from 'drizzle-orm'
import { createDb } from '#/db'
import { getCloudflareEnv } from '#/lib/request-context'
import { user, userProfile } from '#/db/schema'

function getDb() {
  const env = getCloudflareEnv()
  return createDb(env.DB)
}

export const listMembers = createServerFn({ method: 'GET' })
  .validator(
    (data: { search?: string; page?: number; pageSize?: number }) => data,
  )
  .handler(async ({ data }) => {
    const db = getDb()
    const search = data.search || ''
    const page = data.page || 1
    const pageSize = data.pageSize || 10

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
