import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Search,
  Sprout,
  Users,
} from 'lucide-react'
import { cn } from '#/lib/utils'

type Priority = 'High' | 'Medium' | 'Low'

const PRIORITY_DOT: Record<Priority, string> = {
  High: 'bg-priority-high',
  Medium: 'bg-priority-medium',
  Low: 'bg-priority-low',
}

/** Priority shown the way the app shows it: a coloured dot and a label. */
export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('size-2 rounded-full', PRIORITY_DOT[priority])} />
      {priority}
    </span>
  )
}

export function Initials({ children }: { children: string }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
      {children}
    </span>
  )
}

/** Window chrome with the project path, the signature of every preview. */
export function PreviewFrame({
  path,
  children,
  className,
}: {
  path: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-lg border border-border/60 bg-background select-none',
        className,
      )}
    >
      <div className="flex h-9 items-center gap-2 border-b border-border/60 bg-muted/30 px-4">
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {path}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ---------- Hero dashboard mockup ---------- */

const NAV = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Tasks', icon: ListChecks },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Members', icon: Users },
]

const KPIS = [
  { label: 'Open tasks', value: '48', delta: '+6', hint: 'this week' },
  { label: 'Completed', value: '132', delta: '+18%', hint: 'vs last week' },
  { label: 'On-time rate', value: '94%', delta: '+2.4%', hint: 'vs last week' },
  { label: 'Overdue', value: '3', delta: '-2', hint: 'since Monday' },
]

const SERIES = {
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    created: [9, 12, 8, 14, 11, 4, 3],
    done: [7, 10, 11, 12, 15, 5, 2],
  },
  '30d': {
    labels: ['W1', 'W2', 'W3', 'W4'],
    created: [38, 44, 41, 52],
    done: [33, 40, 47, 49],
  },
} as const

type Range = keyof typeof SERIES

const ACTIVITY: Array<{
  title: string
  meta: string
  status: string
  tone: 'blue' | 'muted' | 'warn'
}> = [
  {
    title: 'Fix login redirect',
    meta: 'Website Relaunch · 4m',
    status: 'Completed',
    tone: 'blue',
  },
  {
    title: 'Design settings page',
    meta: 'Website Relaunch · 22m',
    status: 'In progress',
    tone: 'muted',
  },
  {
    title: 'Write onboarding copy',
    meta: 'Mobile App · 1h',
    status: 'Due today',
    tone: 'warn',
  },
  {
    title: 'Audit pricing page',
    meta: 'Marketing · 3h',
    status: 'To do',
    tone: 'muted',
  },
]

const TONE = {
  blue: 'bg-primary text-primary-foreground',
  muted: 'bg-muted text-foreground',
  warn: 'bg-highlight text-highlight-foreground',
}

function MockChart({ range }: { range: Range }) {
  const { labels, created, done } = SERIES[range]
  const max = Math.max(...created, ...done)
  const H = 120
  const groupW = 100 / labels.length
  return (
    <div>
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="h-36 w-full"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2="100"
            y1={H * f}
            y2={H * f}
            className="stroke-border"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {labels.map((l, i) => {
          const c = created[i] ?? 0
          const d = done[i] ?? 0
          const bw = groupW * 0.28
          const x = i * groupW + groupW * 0.18
          return (
            <g key={l}>
              <rect
                x={x}
                y={H - (c / max) * (H - 8)}
                width={bw}
                height={(c / max) * (H - 8)}
                className="fill-blue-2"
              />
              <rect
                x={x + bw + groupW * 0.04}
                y={H - (d / max) * (H - 8)}
                width={bw}
                height={(d / max) * (H - 8)}
                className="fill-blue-4"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex">
        {labels.map((l) => (
          <span
            key={l}
            className="flex-1 text-center font-mono text-[10px] text-muted-foreground"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ProductMockup() {
  const [range, setRange] = useState<Range>('7d')

  return (
    <div
      aria-hidden="true"
      className="bg-border p-px shadow-2xl shadow-black/[0.08] select-none"
    >
      <div className="flex h-[520px] overflow-hidden bg-background text-left sm:h-[600px]">
        {/* Sidebar */}
        <aside
          aria-hidden="true"
          className="hidden w-[212px] shrink-0 flex-col border-r border-border/60 bg-muted/20 lg:flex"
        >
          <div className="flex h-12 items-center gap-2 border-b border-border/60 px-4">
            <span className="chamfer flex size-5 items-center justify-center bg-foreground [--cut:4px]">
              <Sprout className="size-3 text-background" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              WorkNest
            </span>
          </div>
          <p className="eyebrow px-4 pt-4 pb-2">Workspace</p>
          <nav className="flex flex-1 flex-col gap-0.5 px-2">
            {NAV.map(({ label, icon: Icon, active }) => (
              <span
                key={label}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              All projects on track
              <span className="hidden sm:inline">· Updated just now</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
                <Search className="size-3" />
                Search
                <kbd className="ml-4 font-mono text-[10px]">⌘K</kbd>
              </span>
              <Initials>SR</Initials>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="truncate font-sans text-sm font-semibold tracking-tight">
                  Team overview
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Last 7 days · All projects
                </p>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((k) => (
                <div
                  key={k.label}
                  className="flex flex-col justify-between rounded-lg border border-border/60 bg-background p-3"
                >
                  <span className="text-[11px] text-muted-foreground">
                    {k.label}
                  </span>
                  <span className="mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-[1.6rem]">
                    {k.value}
                  </span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    <span className="font-medium text-primary">{k.delta}</span>{' '}
                    {k.hint}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.55fr_1fr]">
              <div className="flex min-h-0 flex-col rounded-lg border border-border/60 bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold tracking-tight">
                      Task activity
                    </h3>
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="size-2 bg-blue-2" /> Created
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 bg-blue-4" /> Completed
                      </span>
                    </div>
                  </div>
                  <div className="flex rounded-md border border-border/60 p-0.5">
                    {(Object.keys(SERIES) as Array<Range>).map((r) => (
                      <button
                        key={r}
                        type="button"
                        tabIndex={-1}
                        onClick={() => setRange(r)}
                        className={cn(
                          'rounded-[4px] px-2 py-0.5 font-mono text-[10px]',
                          r === range
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <MockChart range={range} />
              </div>

              <div className="hidden min-h-0 flex-col rounded-lg border border-border/60 bg-background p-4 sm:flex">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold tracking-tight">
                    Recent activity
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    View all
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {ACTIVITY.map((a) => (
                    <li
                      key={a.title}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.meta}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-[3px] px-1.5 py-1 text-[10px] leading-none font-semibold',
                          TONE[a.tone],
                        )}
                      >
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
