import {
  activity,
  project,
  projectMember,
  task,
  taskAssignee,
  user,
} from '#/db/schema'
import { authMiddleware } from '#/lib/middleware'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, gt, gte, lt, ne, sql } from 'drizzle-orm'

const DAY_MS = 86_400_000
const PRODUCTIVITY_DAYS = 14
const PROGRESS_LIMIT = 6
const WORKLOAD_LIMIT = 8

export const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context: { db, userId } }) => {
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
      myOpenTasks,
      highPriorityTasks,
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
            and(lt(task.deadline, new Date()), ne(task.status, 'COMPLETED')),
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
        .where(and(memberCondition, gt(project.deadline, new Date())))
        .groupBy(project.id)
        .orderBy(project.deadline)
        .limit(5),
      db
        .select({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          projectName: project.name,
        })
        .from(task)
        .innerJoin(taskAssignee, eq(taskAssignee.taskId, task.id))
        .innerJoin(project, eq(project.id, task.projectId))
        .where(
          and(
            eq(taskAssignee.userId, userId),
            sql`${task.status} != 'COMPLETED'`,
          ),
        )
        .orderBy(sql`${task.deadline} IS NULL`, task.deadline)
        .limit(5),
      db
        .select({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          projectName: project.name,
        })
        .from(task)
        .innerJoin(project, eq(project.id, task.projectId))
        .where(
          and(
            sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
            eq(task.priority, 'HIGH'),
            sql`${task.status} != 'COMPLETED'`,
          ),
        )
        .orderBy(sql`${task.deadline} IS NULL`, task.deadline)
        .limit(5),
    ])

    const myTaskCondition = sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const productivityStart = new Date(
      today.getTime() - (PRODUCTIVITY_DAYS - 1) * DAY_MS,
    )
    const completedExpr = sql<number>`coalesce(sum(case when ${task.status} = 'COMPLETED' then 1 else 0 end), 0)`

    const [progressRows, productivityRows, workloadRows] = await Promise.all([
      // Completion per project, busiest projects first.
      db
        .select({
          id: project.id,
          name: project.name,
          total: count(task.id),
          completed: completedExpr,
        })
        .from(project)
        .leftJoin(task, eq(task.projectId, project.id))
        .where(memberCondition)
        .groupBy(project.id)
        .orderBy(desc(count(task.id)), project.name)
        .limit(PROGRESS_LIMIT),
      // Tasks completed per UTC day over the window.
      db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${task.completedAt}, 'unixepoch')`,
          count: count(),
        })
        .from(task)
        .where(
          and(
            myTaskCondition,
            eq(task.status, 'COMPLETED'),
            gte(task.completedAt, productivityStart),
          ),
        )
        .groupBy(sql`1`),
      // Open tasks per assignee, split by priority.
      db
        .select({
          userId: user.id,
          name: user.name,
          image: user.image,
          high: sql<number>`sum(case when ${task.priority} = 'HIGH' then 1 else 0 end)`,
          medium: sql<number>`sum(case when ${task.priority} = 'MEDIUM' then 1 else 0 end)`,
          low: sql<number>`sum(case when ${task.priority} = 'LOW' then 1 else 0 end)`,
          total: count(),
        })
        .from(taskAssignee)
        .innerJoin(task, eq(task.id, taskAssignee.taskId))
        .innerJoin(user, eq(user.id, taskAssignee.userId))
        .where(and(myTaskCondition, sql`${task.status} != 'COMPLETED'`))
        .groupBy(user.id)
        .orderBy(desc(count()), user.name)
        .limit(WORKLOAD_LIMIT),
    ])

    const completedByDay = new Map(
      productivityRows.map((r) => [r.day, r.count]),
    )
    const productivity = Array.from({ length: PRODUCTIVITY_DAYS }, (_, i) => {
      const date = new Date(productivityStart.getTime() + i * DAY_MS)
      const key = date.toISOString().slice(0, 10)
      return {
        date: key,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        }),
        completed: completedByDay.get(key) ?? 0,
      }
    })

    const projectProgress = progressRows.map((p) => ({
      ...p,
      completed: Number(p.completed),
      percent:
        p.total > 0 ? Math.round((Number(p.completed) / p.total) * 100) : 0,
    }))

    const memberWorkload = workloadRows.map((m) => ({
      ...m,
      high: Number(m.high),
      medium: Number(m.medium),
      low: Number(m.low),
    }))

    const statusMap: Record<'COMPLETED' | 'IN_PROGRESS' | 'TODO', number> = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      TODO: 0,
    }
    for (const row of tasksByStatus) {
      if (row.status in statusMap) {
        statusMap[row.status] = row.count
      }
    }

    const priorityMap: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    }
    for (const row of tasksByPriority) {
      if (row.priority in priorityMap) {
        priorityMap[row.priority] = row.count
      }
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
      projectProgress,
      productivity,
      memberWorkload,
      recentActivities: recentActivities.map((a) => ({
        ...a,
        timeAgo: getTimeAgo(a.createdAt),
      })),
      myOpenTasks: myOpenTasks.map(withDue),
      highPriorityTasks: highPriorityTasks.map(withDue),
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
  })

function withDue<T extends { deadline: Date | null }>(t: T) {
  return {
    ...t,
    dueFormatted: t.deadline
      ? new Date(t.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '—',
  }
}

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
