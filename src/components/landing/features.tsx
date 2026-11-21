import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { Bell, Check, Plus } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Initials, PreviewFrame, PriorityDot } from './product-mockup'
import { Container, Reveal, SectionHeading } from './reveal'

function TasksVisual() {
  const tasks = [
    { title: 'Fix login redirect', priority: 'High' as const, due: 'Today' },
    { title: 'Design settings page', priority: 'Medium' as const, due: 'Fri' },
    {
      title: 'Write onboarding copy',
      priority: 'Medium' as const,
      due: 'Dec 9',
    },
    {
      title: 'Set up project board',
      priority: 'Low' as const,
      due: 'Done',
      done: true,
    },
  ]
  return (
    <PreviewFrame path="Website Relaunch / Tasks">
      <div className="divide-y divide-border px-5">
        {tasks.map((t) => (
          <div key={t.title} className="flex h-12 items-center gap-3">
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border border-border',
                t.done && 'border-foreground bg-foreground',
              )}
            >
              {t.done && <Check className="size-3 text-background" />}
            </span>
            <span
              className={cn(
                'flex-1 truncate text-sm',
                t.done
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground',
              )}
            >
              {t.title}
            </span>
            <span className="w-20">
              <PriorityDot priority={t.priority} />
            </span>
            <span className="hidden w-12 text-right font-mono text-xs text-muted-foreground sm:inline">
              {t.due}
            </span>
          </div>
        ))}
      </div>
    </PreviewFrame>
  )
}

function RolesVisual() {
  const members = [
    { name: 'Sam Rivera', who: 'SR', role: 'Admin' },
    { name: 'Alex Kim', who: 'AK', role: 'Project Manager' },
    { name: 'Jordan Moss', who: 'JM', role: 'Team Member' },
  ]
  return (
    <PreviewFrame path="Website Relaunch / Members">
      <div className="divide-y divide-border px-5">
        {members.map((m) => (
          <div key={m.name} className="flex h-12 items-center gap-3">
            <Initials>{m.who}</Initials>
            <span className="flex-1 text-sm text-foreground">{m.name}</span>
            <span className="rounded-[3px] bg-muted px-1.5 py-1 text-[11px] leading-none font-semibold text-foreground">
              {m.role}
            </span>
          </div>
        ))}
        <div className="flex h-12 items-center gap-3 text-sm text-muted-foreground">
          <span className="flex size-6 items-center justify-center">
            <Plus className="size-4" />
          </span>
          Invite a teammate
        </div>
      </div>
    </PreviewFrame>
  )
}

function ChatVisual() {
  const messages = [
    {
      who: 'JM',
      name: 'Jordan',
      text: 'Pushed the new header, can someone review?',
    },
    { who: 'AK', name: 'Alex', text: 'On it. Looks good on mobile too' },
    { who: 'SR', name: 'Sam', text: 'Great, let’s ship it today' },
  ]
  return (
    <PreviewFrame path="Website Relaunch / Chat">
      <div className="space-y-4 p-5">
        {messages.map((m) => (
          <div key={m.text} className="flex items-start gap-3">
            <Initials>{m.who}</Initials>
            <div>
              <p className="text-xs font-semibold text-foreground">{m.name}</p>
              <p className="text-sm text-description">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  )
}

function DashboardVisual() {
  const stats = [
    { label: 'Open tasks', value: '12' },
    { label: 'Due this week', value: '5' },
    { label: 'Completed', value: '38' },
  ]
  return (
    <PreviewFrame path="Dashboard">
      <div className="p-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border/60 bg-background p-3"
            >
              <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
          <Bell className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-foreground">Task assigned to you</p>
            <p className="text-xs text-muted-foreground">
              Alex assigned you “Fix login redirect”
            </p>
          </div>
        </div>
      </div>
    </PreviewFrame>
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
    eyebrow: 'Execution · Tasks',
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
    eyebrow: 'Access · Roles',
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
    eyebrow: 'Together · Chat',
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
    eyebrow: 'Insight · Dashboard',
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

const MAX_TILT = 4

/** Lifts and tilts toward the cursor, with a light that follows it. */
function FeatureCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    el.dataset.hover = ''
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
    el.style.setProperty('--rx', `${(x - 0.5) * MAX_TILT * 2}deg`)
    el.style.setProperty('--ry', `${(0.5 - y) * MAX_TILT * 2}deg`)
  }

  const onPointerLeave = () => {
    const el = ref.current
    if (!el) return
    delete el.dataset.hover
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="feature-card chamfer bg-border p-px [--cut:14px]"
    >
      <div aria-hidden="true" className="feature-card-glow" />
      <article className="chamfer relative flex h-full flex-col overflow-hidden bg-background p-6 [--cut:14px] sm:p-7">
        <div aria-hidden="true" className="feature-card-spot" />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </article>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="One workspace that plans, tracks and ships"
          description="Tasks, roles, chat and a dashboard. Four building blocks that cover how most small teams work."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {features.map((f, i) => (
            <Reveal key={f.eyebrow} delay={(i % 2) * 80}>
              <FeatureCard>
                <p className="eyebrow">{f.eyebrow}</p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {f.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-[13px] text-foreground"
                    >
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="feature-card-visual mt-7 flex-1 content-end">
                  {f.visual}
                </div>
              </FeatureCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
