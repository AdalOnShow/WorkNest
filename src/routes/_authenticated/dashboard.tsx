import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '#/components/layout/page-container'
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard — WorkNest' }],
  }),
})

const KPI_CARDS = [
  { label: 'Total Projects', value: '12', icon: FolderKanban, color: 'var(--color-primary)' },
  { label: 'Total Tasks', value: '48', icon: CheckSquare, color: 'var(--color-status-in-progress)' },
  { label: 'Completed Tasks', value: '32', icon: CheckCircle2, color: 'var(--color-muted)' },
  { label: 'Overdue Tasks', value: '5', icon: AlertTriangle, color: 'var(--color-error)' },
]

const RECENT_ACTIVITY = [
  { id: '1', text: 'Task "Fix login bug" marked as completed', time: '2 hours ago' },
  { id: '2', text: 'Mike R. joined Website Redesign project', time: '4 hours ago' },
  { id: '3', text: 'New comment on "Add tests" task', time: '6 hours ago' },
  { id: '4', text: 'Project "API Backend" moved to On Hold', time: '1 day ago' },
]

const UPCOMING_DEADLINES = [
  { id: '1', project: 'Website Redesign', deadline: 'Feb 28', tasks: 3 },
  { id: '2', project: 'Mobile App', deadline: 'Mar 10', tasks: 5 },
  { id: '3', project: 'Dashboard', deadline: 'Mar 15', tasks: 2 },
]

function DashboardPage() {
  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="headline-sm text-foreground">Dashboard</h1>
          <p className="body-md text-muted-foreground mt-1">
            Welcome back — here's your overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="bg-card border border-border rounded-[14px] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="label-sm text-muted-foreground">{card.label}</span>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <p className="text-3xl font-bold text-foreground mt-3">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="label-lg text-foreground mb-4">Tasks by Status</h3>
            <div className="flex items-center justify-center h-48">
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[var(--color-status-active)] flex items-center justify-center">
                    <span className="text-foreground font-bold">32</span>
                  </div>
                  <span className="text-muted-foreground mt-2 block">Done</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[var(--color-status-in-progress)] flex items-center justify-center">
                    <span className="text-foreground font-bold">8</span>
                  </div>
                  <span className="text-muted-foreground mt-2 block">In Progress</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[var(--color-status-todo)] flex items-center justify-center">
                    <span className="text-foreground font-bold">8</span>
                  </div>
                  <span className="text-muted-foreground mt-2 block">To Do</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="label-lg text-foreground mb-4">Tasks by Priority</h3>
            <div className="flex items-end justify-center h-48 gap-6 px-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 bg-[var(--color-priority-high)] rounded-t-md" style={{ height: '40px' }} />
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 bg-[var(--color-priority-medium)] rounded-t-md" style={{ height: '80px' }} />
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 bg-[var(--color-priority-low)] rounded-t-md" style={{ height: '60px' }} />
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity + Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="label-lg text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="body-sm text-card-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="label-lg text-foreground mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {UPCOMING_DEADLINES.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border/50"
                >
                  <div>
                    <p className="body-sm text-foreground font-medium">{item.project}</p>
                    <p className="text-xs text-muted-foreground">{item.tasks} tasks remaining</p>
                  </div>
                  <span className="label-sm text-[var(--color-status-on-hold)]">{item.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
