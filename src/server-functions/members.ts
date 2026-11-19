import { projectMember, user, userProfile } from '#/db/schema'
import { authMiddleware } from '#/lib/middleware'
import { escapeLikePattern } from '#/lib/sql'
import { createServerFn } from '@tanstack/react-start'
import { and, count, eq, sql } from 'drizzle-orm'

export const listMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { search?: string; page?: number; pageSize?: number }) => ({
    search: data.search,
    page: Math.max(1, Math.floor(data.page || 1)),
    pageSize: Math.min(100, Math.max(1, Math.floor(data.pageSize || 10))),
  }))
  .handler(async ({ data, context: { db, userId } }) => {
    const search = data.search || ''
    const page = data.page
    const pageSize = data.pageSize

    const memberProjects = sql`SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId}`
    const isAdmin = sql`SELECT ${userProfile.role} FROM ${userProfile} WHERE ${userProfile.id} = ${userId} AND ${userProfile.role} IN ('ADMIN', 'PROJECT_MANAGER')`

    const conditions = [
      sql`(${user.id} IN (${memberProjects}) OR ${user.id} IN (${isAdmin}))`,
    ]
    if (search) {
      const escapedSearch = escapeLikePattern(search)
      conditions.push(
        sql`(${user.name} LIKE ${`%${escapedSearch}%`} ESCAPE '\\' OR ${user.email} LIKE ${`%${escapedSearch}%`} ESCAPE '\\')`,
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
