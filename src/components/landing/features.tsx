import type { ReactNode } from 'react'
import { Bell, Check, MessageSquare } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Initials, PriorityDot } from './product-mockup'
import { Reveal, SectionHeading } from './reveal'

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 select-none"
    >
      {children}
    </div>
  )
}

function TasksVisual() {
  const tasks = [
    {
      title: 'Fix login redirect',
      status: 'In progress',
      priority: 'High' as const,
      due: 'Today',
    },
    {
      title: 'Design settings page',
      status: 'In progress',
      priority: 'Medium' as const,
      due: 'Fri',
    },
    {
      title: 'Write onboarding copy',
      status: 'To do',
      priority: 'Medium' as const,
      due: 'Next week',
    },
    {
      title: 'Set up project board',
      status: 'Completed',
      priority: 'Low' as const,
      due: 'Done',
    },
  ]
  return (
    <Panel>
      <div className="divide-y divide-border">
        {tasks.map((t) => (
          <div
            key={t.title}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border border-border',
                t.status === 'Completed' && 'bg-primary border-primary',
              )}
            >
              {t.status === 'Completed' && (
                <Check className="size-3 text-primary-foreground" />
              )}
            </span>
            <span className="flex-1 text-sm text-foreground truncate">
              {t.title}
            </span>
            <PriorityDot priority={t.priority} />
            <span className="hidden sm:inline w-20 text-right text-xs text-muted-foreground">
              {t.due}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RolesVisual() {
  const members = [
    { name: 'Sam Rivera', who: 'SR', role: 'Admin' },
    { name: 'Alex Kim', who: 'AK', role: 'Project Manager' },
    { name: 'Jordan Moss', who: 'JM', role: 'Team Member' },
  ]
  return (
    <Panel>
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <Initials>{m.who}</Initials>
            <span className="flex-1 text-sm text-foreground">{m.name}</span>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              {m.role}
            </span>
          </div>
        ))}
        <div className="rounded-full border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          + Invite a teammate
        </div>
      </div>
    </Panel>
  )
}

function ChatVisual() {
  const messages = [
    {
      who: 'JM',
      name: 'Jordan',
      text: 'Pushed the new header, can someone review?',
    },
    { who: 'AK', name: 'Alex', text: 'On it. Looks good on mobile too.' },
    { who: 'SR', name: 'Sam', text: 'Great, let’s ship it today.' },
  ]
  return (
    <Panel>
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <MessageSquare className="size-3.5" /> # website-relaunch
      </div>
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.text} className="flex items-start gap-2.5">
            <Initials>{m.who}</Initials>
            <div>
              <p className="text-xs font-medium text-foreground">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function DashboardVisual() {
  const stats = [
    { label: 'Open tasks', value: '12' },
    { label: 'Due this week', value: '5' },
    { label: 'Completed', value: '38' },
  ]
  return (
    <Panel>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-background/60 p-3">
            <p className="text-xl font-semibold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-border p-3">
        <Bell className="size-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm text-foreground">Task assigned to you</p>
          <p className="text-xs text-muted-foreground">
            Alex assigned you “Fix login redirect”
          </p>
        </div>
      </div>
    </Panel>
  )
}

const features: Array<{
  eyebrow: string
  title: string
  description: string
  points: Array<string>
  visual: ReactNode
}> = [
  {
    eyebrow: 'Tasks',
    title: 'Know what needs doing, and who is doing it',
    description:
      'Every task has a status, a priority, a due date and an owner. Search, filter and sort to find what matters right now.',
    points: [
      'To do, In progress and Completed statuses',
      'High, Medium and Low priority',
      'Comments on every task',
    ],
    visual: <TasksVisual />,
  },
  {
    eyebrow: 'Roles',
    title: 'The right access for each person',
    description:
      'Permissions are set per project. Someone can run one project as an admin and be a team member on another.',
    points: [
      'Admins manage the project and its members',
      'Project Managers plan and assign work',
      'Team Members see only the projects they belong to',
    ],
    visual: <RolesVisual />,
  },
  {
    eyebrow: 'Project chat',
    title: 'A chat room for every project',
    description:
      'Conversations stay next to the work they are about. Messages arrive in real time and the history is saved.',
    points: [
      'One room per project',
      'Real-time messages',
      'Full message history',
    ],
    visual: <ChatVisual />,
  },
  {
    eyebrow: 'Dashboard',
    title: 'See progress at a glance',
    description:
      'Your dashboard shows open work, upcoming deadlines and recent activity. Notifications tell you when something changes for you.',
    points: [
      'Task and project overview',
      'Activity feed',
      'Notifications for assignments and updates',
    ],
    visual: <DashboardVisual />,
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything your team needs, nothing it doesn’t"
          description="Four building blocks that cover how most small teams actually work."
        />

        <div className="space-y-20 md:space-y-28 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <Reveal
              key={f.eyebrow}
              className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
            >
              <div className={cn(i % 2 === 1 && 'md:order-2')}>
                <p className="text-sm font-medium text-primary mb-3">
                  {f.eyebrow}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  {f.title}
                </h3>
                <p className="text-muted-foreground mb-6">{f.description}</p>
                <ul className="space-y-2">
                  {f.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn(i % 2 === 1 && 'md:order-1')}>{f.visual}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
