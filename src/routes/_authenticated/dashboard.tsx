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
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <StatusPill overdue={kpi.overdueTasks} />
            <h1 className="headline-sm mt-4 text-foreground">Overview</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              <span suppressHydrationWarning>{today}</span> · All your projects
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <Badge variant="destructive">Needs attention</Badge>
              ) : (
                'Nothing overdue'
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel
            title="Completed tasks"
            description="Tasks completed per day"
            className="lg:col-span-2"
          >
            <Suspense fallback={<Skeleton className="h-72 w-full" />}>
              <ProductivityChart data={productivity} />
            </Suspense>
          </Panel>

          <div className="grid gap-3">
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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel
            title="Member workload"
            description="Open tasks per assignee, by priority"
            className="lg:col-span-2"
          >
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <MemberWorkload items={memberWorkload} />
            </Suspense>
          </Panel>
          <Panel
            title="Project progress"
            action={{ to: '/projects', label: 'All projects' }}
          >
            <ProjectProgress items={projectProgress} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel
            title="My tasks"
            className="lg:col-span-2"
            action={{ to: '/tasks', label: 'View all' }}
          >
            <TaskList
              items={myOpenTasks}
              empty="No open tasks assigned to you"
            />
          </Panel>
          <Panel title="Upcoming deadlines">
            {upcomingDeadlines.length === 0 ? (
              <EmptyLine>No upcoming deadlines</EmptyLine>
            ) : (
              <ul className="-my-2 divide-y divide-border/60">
                {upcomingDeadlines.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: item.id }}
                        className="block truncate text-[13px] font-medium text-foreground hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {item.taskCount} open{' '}
                        {item.taskCount === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-[3px] bg-muted px-1.5 py-1 font-mono text-[11px] leading-none text-foreground tabular-nums">
                      {item.deadlineFormatted}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel title="High priority" className="lg:col-span-2">
            <TaskList
              items={highPriorityTasks}
              empty="No open high priority tasks"
            />
          </Panel>
          <Panel
            title="Recent activity"
            action={{ to: '/notifications', label: 'Notifications' }}
          >
            {recentActivities.length === 0 ? (
              <EmptyLine>No recent activity</EmptyLine>
            ) : (
              <ol className="-my-2 divide-y divide-border/60">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          activityTone(activity.action),
                        )}
                      />
                      <p className="truncate text-[13px] text-foreground">
                        {activityLabel(activity.action)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {activity.timeAgo}
                    </span>
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

/** Dot colour for an activity row: blue for progress, red for removals. */
function activityTone(action: string) {
  if (action.endsWith('_DELETED') || action.endsWith('_REMOVED'))
    return 'bg-destructive'
  if (action === 'TASK_STATUS_UPDATED' || action.endsWith('_CREATED'))
    return 'bg-primary'
  return 'bg-muted-foreground/50'
}

function StatusPill({ overdue }: { overdue: number }) {
  const ok = overdue === 0
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="relative flex size-1.5">
        {ok && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            'relative inline-flex size-1.5 rounded-full',
            ok ? 'bg-primary' : 'bg-destructive',
          )}
        />
      </span>
      {ok
        ? 'All caught up'
        : `${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'}`}
      <span className="hidden sm:inline">· Updated just now</span>
    </span>
  )
}

function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: { to: '/projects' | '/tasks' | '/notifications'; label: string }
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-border/60 bg-background p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-sans text-[13px] font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link
            to={action.to}
            className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
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
    <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-background p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="stat-number mt-3 text-foreground sm:text-[2rem]">{value}</p>
      <div className="mt-2 flex min-h-5 items-center text-[11px] text-muted-foreground">
        {context}
      </div>
    </div>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-[13px] text-muted-foreground">
      {children}
    </p>
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
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-foreground">{row.label}</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
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
              className="h-1.5 overflow-hidden rounded-[2px] bg-muted"
            >
              <div
                className={cn('h-full rounded-[2px]', row.color)}
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
    <ul className="-my-2 divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to="/tasks/$taskId"
            params={{ taskId: item.id }}
            className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {item.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.projectName}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
              {item.dueFormatted}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
