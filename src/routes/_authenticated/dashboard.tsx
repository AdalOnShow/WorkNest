import { PageContainer } from '#/components/layout/page-container'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import { getDashboardData } from '#/server-functions/dashboard'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard')({
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

  const kpiCards = [
    {
      label: 'Total Projects',
      value: kpi.totalProjects,
      icon: FolderKanban,
      color: 'var(--color-primary)',
    },
    {
      label: 'Total Tasks',
      value: kpi.totalTasks,
      icon: CheckSquare,
      color: 'var(--color-status-in-progress)',
    },
    {
      label: 'Completed Tasks',
      value: kpi.completedTasks,
      icon: CheckCircle2,
      color: 'var(--color-muted)',
    },
    {
      label: 'Overdue Tasks',
      value: kpi.overdueTasks,
      icon: AlertTriangle,
      color: 'var(--color-error)',
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
              className="bg-card border border-border rounded-[14px] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="label-sm text-muted-foreground">
                  {card.label}
                </span>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <p className="text-3xl font-bold text-foreground mt-3">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-[14px] p-6">
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

          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="label-lg text-foreground mb-4">Tasks by Priority</h3>
            <div className="flex items-end justify-center h-48 gap-6 px-4">
              {priorityTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 bg-(--color-priority-high) rounded-t-md"
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
                      className="w-12 bg-(--color-priority-medium) rounded-t-md"
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
                      className="w-12 bg-(--color-priority-low) rounded-t-md"
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
          <div className="bg-card border border-border rounded-[14px] p-6">
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

          <div className="bg-card border border-border rounded-[14px] p-6">
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
                      <p className="body-sm text-foreground font-medium">
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
