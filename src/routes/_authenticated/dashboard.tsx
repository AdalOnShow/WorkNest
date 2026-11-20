import { ProjectProgress } from '#/components/dashboard/project-progress'
import { PageContainer } from '#/components/layout/page-container'
import { Skeleton } from '#/components/ui/skeleton'
import { lazy, Suspense } from 'react'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import { getDashboardData } from '#/server-functions/dashboard'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getOnboardingStatus } from '#/server-functions/onboarding'
import type { ReactNode } from 'react'
import { PageHeader } from '#/components/layout/page-header'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'

// Recharts is the bulk of this route's JS; load it after the KPIs and lists.
const ProductivityChart = lazy(() =>
  import('#/components/dashboard/productivity-chart').then((m) => ({
    default: m.ProductivityChart,
  })),
)
const MemberWorkload = lazy(() =>
  import('#/components/dashboard/member-workload').then((m) => ({
    default: m.MemberWorkload,
  })),
)

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async () => {
    // New users (no projects, onboarding not finished) get the setup guide.
    const status = await getOnboardingStatus().catch(() => null)
    if (status?.shouldOnboard) {
      throw redirect({ to: '/onboarding', search: { step: 'welcome' } })
    }
  },
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard — WorkNest' }],
  }),
})

function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
  })

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="detail" />
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer>
        <ErrorState
          title="Dashboard unavailable"
          message="We couldn't load your dashboard data."
          onRetry={() => void refetch()}
        />
      </PageContainer>
    )
  }

  const kpi = data?.kpi || {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  }
  const tasksByStatus = data?.tasksByStatus || {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    TODO: 0,
  }
  const tasksByPriority = data?.tasksByPriority || {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  }
  const priorityTotal =
    tasksByPriority.HIGH + tasksByPriority.MEDIUM + tasksByPriority.LOW
  const recentActivities = data?.recentActivities || []
  const upcomingDeadlines = data?.upcomingDeadlines || []
  const myOpenTasks = data?.myOpenTasks || []
  const highPriorityTasks = data?.highPriorityTasks || []
  const projectProgress = data?.projectProgress || []
  const productivity = data?.productivity || []
  const memberWorkload = data?.memberWorkload || []

  const statusTotal =
    tasksByStatus.COMPLETED + tasksByStatus.IN_PROGRESS + tasksByStatus.TODO
  const completedShare =
    kpi.totalTasks > 0
      ? Math.round((kpi.completedTasks / kpi.totalTasks) * 100)
      : 0

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={<span suppressHydrationWarning>{today}</span>}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Projects"
            value={kpi.totalProjects}
            context="Projects you belong to"
          />
          <StatCard
            label="Tasks"
            value={kpi.totalTasks}
            context={`${tasksByStatus.IN_PROGRESS} in progress`}
          />
          <StatCard
            label="Completed"
            value={kpi.completedTasks}
            context={`${completedShare}% of all tasks`}
          />
          <StatCard
            label="Overdue"
            value={kpi.overdueTasks}
            context={
              kpi.overdueTasks > 0 ? (
                <Badge variant="yellow">Needs attention</Badge>
              ) : (
                'Nothing overdue'
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Completed tasks" className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-72 w-full" />}>
              <ProductivityChart data={productivity} />
            </Suspense>
          </Panel>

          <div className="grid gap-4">
            <Panel title="Tasks by status">
              <ShareList
                total={statusTotal}
                empty="No tasks yet"
                rows={[
                  {
                    label: 'To do',
                    value: tasksByStatus.TODO,
                    color: 'bg-status-todo',
                  },
                  {
                    label: 'In progress',
                    value: tasksByStatus.IN_PROGRESS,
                    color: 'bg-status-in-progress',
                  },
                  {
                    label: 'Completed',
                    value: tasksByStatus.COMPLETED,
                    color: 'bg-status-completed',
                  },
                ]}
              />
            </Panel>
            <Panel title="Tasks by priority">
              <ShareList
                total={priorityTotal}
                empty="No tasks yet"
                rows={[
                  {
                    label: 'High',
                    value: tasksByPriority.HIGH,
                    color: 'bg-chart-priority-high',
                  },
                  {
                    label: 'Medium',
                    value: tasksByPriority.MEDIUM,
                    color: 'bg-chart-priority-medium',
                  },
                  {
                    label: 'Low',
                    value: tasksByPriority.LOW,
                    color: 'bg-chart-priority-low',
                  },
                ]}
              />
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Member workload"
            description="Open tasks per assignee, by priority"
            className="lg:col-span-2"
          >
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <MemberWorkload items={memberWorkload} />
            </Suspense>
          </Panel>
          <Panel title="Project progress">
            <ProjectProgress items={projectProgress} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="My tasks" className="lg:col-span-2">
            <TaskList
              items={myOpenTasks}
              empty="No open tasks assigned to you"
            />
          </Panel>
          <Panel title="Upcoming deadlines">
            {upcomingDeadlines.length === 0 ? (
              <EmptyLine>No upcoming deadlines</EmptyLine>
            ) : (
              <ul className="-my-2 divide-y divide-border">
                {upcomingDeadlines.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: item.id }}
                        className="body-sm block truncate font-semibold text-foreground hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {item.taskCount} open{' '}
                        {item.taskCount === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-foreground tabular-nums">
                      {item.deadlineFormatted}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="High priority" className="lg:col-span-2">
            <TaskList
              items={highPriorityTasks}
              empty="No open high priority tasks"
            />
          </Panel>
          <Panel title="Recent activity">
            {recentActivities.length === 0 ? (
              <EmptyLine>No recent activity</EmptyLine>
            ) : (
              <ol className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="body-sm text-foreground">
                        {activityLabel(activity.action)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {activity.timeAgo}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}

const ACTIVITY_LABELS: Record<string, string> = {
  PROJECT_CREATED: 'Project created',
  PROJECT_UPDATED: 'Project updated',
  PROJECT_MEMBER_INVITED: 'Member invited',
  PROJECT_MEMBER_ADDED: 'Member joined a project',
  PROJECT_MEMBER_REMOVED: 'Member removed',
  TASK_CREATED: 'Task created',
  TASK_UPDATED: 'Task updated',
  TASK_STATUS_UPDATED: 'Task status changed',
  TASK_DELETED: 'Task deleted',
  COMMENT_ADDED: 'Comment added',
  COMMENT_UPDATED: 'Comment edited',
  COMMENT_DELETED: 'Comment deleted',
}

function activityLabel(action: string) {
  if (action in ACTIVITY_LABELS) return ACTIVITY_LABELS[action]
  const words = action.toLowerCase().replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function Panel({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card p-6', className)}
    >
      <h2 className="label-lg text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function StatCard({
  label,
  value,
  context,
}: {
  label: string
  value: number
  context: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="stat-number mt-4 text-foreground">{value}</p>
      <div className="mt-3 flex min-h-6 items-center text-sm text-muted-foreground">
        {context}
      </div>
    </div>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  )
}

/** Parts of a whole as labelled thin bars; identity never rests on colour. */
function ShareList({
  rows,
  total,
  empty,
}: {
  rows: Array<{ label: string; value: number; color: string }>
  total: number
  empty: string
}) {
  if (total === 0) return <EmptyLine>{empty}</EmptyLine>
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const pct = Math.round((row.value / total) * 100)
        return (
          <li key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-foreground">{row.label}</span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {row.value} · {pct}%
              </span>
            </div>
            <div
              role="meter"
              aria-label={row.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${row.value} of ${total} (${pct}%)`}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn('h-full rounded-full', row.color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function TaskList({
  items,
  empty,
}: {
  items: Array<{
    id: string
    title: string
    projectName: string | null
    dueFormatted: string
  }>
  empty: string
}) {
  if (items.length === 0) return <EmptyLine>{empty}</EmptyLine>
  return (
    <ul className="-my-2 divide-y divide-border">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to="/tasks/$taskId"
            params={{ taskId: item.id }}
            className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="body-sm truncate font-semibold text-foreground">
                {item.title}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {item.projectName}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {item.dueFormatted}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
