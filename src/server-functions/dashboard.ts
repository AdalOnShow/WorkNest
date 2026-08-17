import { createDb } from '#/db'
import { activity, project, projectMember, task } from '#/db/schema'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, sql } from 'drizzle-orm'

function getDb() {
  const env = getCloudflareEnv()
  return createDb(env.DB)
}

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const env = getCloudflareEnv()
    const auth = (await import('#/lib/auth')).createAuth(env)
    const request = (await import('@tanstack/react-start/server')).getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    const userId = session.user.id

    const db = getDb()

    const memberCondition = sql`${project.id} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      recentActivities,
      upcomingDeadlines,
    ] = await Promise.all([
      db.select({ count: count() }).from(project).where(memberCondition),
      db
        .select({ count: count() })
        .from(task)
        .where(
          sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
        ),
      db
        .select({ count: count() })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
            eq(task.status, 'COMPLETED'),
          ),
        ),
      db
        .select({ count: count() })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
            sql`${task.deadline} IS NOT NULL AND ${task.deadline} < ${Date.now()} AND ${task.completedAt} IS NULL`,
          ),
        ),
      db
        .select({
          status: task.status,
          count: count(),
        })
        .from(task)
        .where(
          sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
        )
        .groupBy(task.status),
      db
        .select({
          priority: task.priority,
          count: count(),
        })
        .from(task)
        .where(
          sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
        )
        .groupBy(task.priority),
      db
        .select({
          id: activity.id,
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
        })
        .from(activity)
        .where(
          sql`${activity.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
        )
        .orderBy(desc(activity.createdAt))
        .limit(5),
      db
        .select({
          id: project.id,
          name: project.name,
          deadline: project.deadline,
          taskCount: count(task.id),
        })
        .from(project)
        .leftJoin(
          task,
          and(
            eq(task.projectId, project.id),
            sql`${task.status} != 'COMPLETED'`,
          ),
        )
        .where(
          and(
            memberCondition,
            sql`${project.deadline} IS NOT NULL AND ${project.deadline} > ${Date.now()}`,
          ),
        )
        .groupBy(project.id)
        .orderBy(project.deadline)
        .limit(5),
    ])

    const statusMap: Record<string, number> = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      TODO: 0,
    }
    for (const row of tasksByStatus) {
      statusMap[row.status] = row.count
    }

    const priorityMap: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 }
    for (const row of tasksByPriority) {
      priorityMap[row.priority] = row.count
    }

    return {
      kpi: {
        totalProjects: totalProjects[0]?.count || 0,
        totalTasks: totalTasks[0]?.count || 0,
        completedTasks: completedTasks[0]?.count || 0,
        overdueTasks: overdueTasks[0]?.count || 0,
      },
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      recentActivities: recentActivities.map((a) => ({
        ...a,
        timeAgo: getTimeAgo(a.createdAt),
      })),
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        ...d,
        deadlineFormatted: d.deadline
          ? new Date(d.deadline).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '—',
      })),
    }
  },
)

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
