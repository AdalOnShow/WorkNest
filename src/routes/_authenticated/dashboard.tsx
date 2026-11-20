import { MemberWorkload } from '#/components/dashboard/member-workload'
import { ProductivityChart } from '#/components/dashboard/productivity-chart'
import { ProjectProgress } from '#/components/dashboard/project-progress'
import { PageContainer } from '#/components/layout/page-container'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import { getDashboardData } from '#/server-functions/dashboard'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getOnboardingStatus } from '#/server-functions/onboarding'
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
} from 'lucide-react'

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

  const kpiCards = [
    {
      label: 'Total Projects',
      value: kpi.totalProjects,
      icon: FolderKanban,
      chip: 'bg-primary text-primary-foreground',
    },
    {
      label: 'Total Tasks',
      value: kpi.totalTasks,
      icon: CheckSquare,
      chip: 'bg-sky text-sky-foreground',
    },
    {
      label: 'Completed Tasks',
      value: kpi.completedTasks,
      icon: CheckCircle2,
      chip: 'bg-lime text-lime-foreground',
    },
    {
      label: 'Overdue Tasks',
      value: kpi.overdueTasks,
      icon: AlertTriangle,
      chip: 'bg-highlight text-highlight-foreground',
    },
  ]

  const statusTotal =
    tasksByStatus.COMPLETED + tasksByStatus.IN_PROGRESS + tasksByStatus.TODO

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="headline-sm text-foreground">Dashboard</h1>
          <p className="body-md text-muted-foreground mt-1">
            Welcome back — here's your overview
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="bg-card border border-border rounded-xl p-5"
            >
              <span className="label-lg text-foreground">{card.label}</span>
              <div className="mt-6 flex items-end justify-between">
                <p className="stat-number text-foreground">{card.value}</p>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 ${card.chip}`}
                >
                  <card.icon className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-1">Team Productivity</h3>
            <ProductivityChart data={productivity} />
          </section>
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-4">Project Progress</h3>
            <ProjectProgress items={projectProgress} />
          </section>
        </div>

        <section className="bg-card border border-border rounded-xl p-6">
          <h3 className="label-lg text-foreground mb-1">Member Workload</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Open tasks per assignee, by priority
          </p>
          <MemberWorkload items={memberWorkload} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-4">Tasks by Status</h3>
            <div className="flex items-center justify-center h-48">
              {statusTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-(--color-status-active) flex items-center justify-center">
                      <span className="text-foreground font-bold">
                        {tasksByStatus.COMPLETED}
                      </span>
                    </div>
                    <span className="text-muted-foreground mt-2 block">
                      Done
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-(--color-status-in-progress) flex items-center justify-center">
                      <span className="text-foreground font-bold">
                        {tasksByStatus.IN_PROGRESS}
                      </span>
                    </div>
                    <span className="text-muted-foreground mt-2 block">
                      In Progress
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-(--color-status-todo) flex items-center justify-center">
                      <span className="text-foreground font-bold">
                        {tasksByStatus.TODO}
                      </span>
                    </div>
                    <span className="text-muted-foreground mt-2 block">
                      To Do
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-4">Tasks by Priority</h3>
            <div className="flex items-end justify-center h-48 gap-6 px-4">
              {priorityTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 bg-chart-priority-high rounded-t-md"
                      style={{
                        height: `${Math.max(20, (tasksByPriority.HIGH / priorityTotal) * 160)}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      High ({tasksByPriority.HIGH})
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 bg-chart-priority-medium rounded-t-md"
                      style={{
                        height: `${Math.max(20, (tasksByPriority.MEDIUM / priorityTotal) * 160)}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Medium ({tasksByPriority.MEDIUM})
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 bg-chart-priority-low rounded-t-md"
                      style={{
                        height: `${Math.max(20, (tasksByPriority.LOW / priorityTotal) * 160)}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Low ({tasksByPriority.LOW})
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              title: 'My Tasks',
              empty: 'No open tasks assigned to you',
              items: myOpenTasks,
            },
            {
              title: 'High Priority Tasks',
              empty: 'No open high priority tasks',
              items: highPriorityTasks,
            },
          ].map((section) => (
            <div
              key={section.title}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="label-lg text-foreground mb-4">{section.title}</h3>
              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {section.empty}
                </p>
              ) : (
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      to="/tasks/$taskId"
                      params={{ taskId: item.id }}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-accent/50 border border-border/50 hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="body-sm text-foreground font-semibold truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.projectName}
                        </p>
                      </div>
                      <span className="label-sm text-muted-foreground shrink-0">
                        {item.dueFormatted}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-4">Recent Activity</h3>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="body-sm text-card-foreground">
                        {activity.action} {activity.entityType}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="label-lg text-foreground mb-4">
              Upcoming Deadlines
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border/50"
                  >
                    <div>
                      <p className="body-sm text-foreground font-semibold">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.taskCount} tasks remaining
                      </p>
                    </div>
                    <span className="label-sm text-(--color-status-on-hold)">
                      {item.deadlineFormatted}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
