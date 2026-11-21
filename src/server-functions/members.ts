import { projectMember, user } from '#/db/schema'
import { authMiddleware } from '#/lib/middleware'
import { escapeLikePattern } from '#/lib/sql'
import { paginationSchema, searchSchema, input } from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
import { and, countDistinct, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

type ProjectRole = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
const ROLE_BY_RANK: Array<ProjectRole> = [
  'ADMIN',
  'PROJECT_MANAGER',
  'TEAM_MEMBER',
]

/**
 * Lists everyone who shares at least one project with the current user.
 * Roles are per project, so each member's highest role across the shared
 * projects is returned along with the number of shared projects.
 */
export const listMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(input(z.object({ search: searchSchema, ...paginationSchema(10) })))
  .handler(async ({ data, context: { db, userId } }) => {
    const search = data.search || ''
    const { page, pageSize } = data

    const myProjectIds = db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, userId))

    const conditions = [inArray(projectMember.projectId, myProjectIds)]
    if (search) {
      const escapedSearch = escapeLikePattern(search)
      conditions.push(
        sql`(${user.name} LIKE ${`%${escapedSearch}%`} ESCAPE '\\' OR ${user.email} LIKE ${`%${escapedSearch}%`} ESCAPE '\\')`,
      )
    }
    const where = and(...conditions)

    const roleRank = sql<number>`MIN(CASE ${projectMember.role} WHEN 'ADMIN' THEN 0 WHEN 'PROJECT_MANAGER' THEN 1 ELSE 2 END)`

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          roleRank,
          projectCount: countDistinct(projectMember.projectId),
        })
        .from(projectMember)
        .innerJoin(user, eq(user.id, projectMember.userId))
        .where(where)
        .groupBy(user.id)
        .orderBy(user.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: countDistinct(projectMember.userId) })
        .from(projectMember)
        .innerJoin(user, eq(user.id, projectMember.userId))
        .where(where),
    ])

    const items = rows.map(({ roleRank: rank, ...member }) => ({
      ...member,
      role: ROLE_BY_RANK[rank] ?? 'TEAM_MEMBER',
    }))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page }
  })
