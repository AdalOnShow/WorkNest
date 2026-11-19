import { cn } from '#/lib/utils'

type Priority = 'High' | 'Medium' | 'Low'

const columns: Array<{
  title: string
  tasks: Array<{ title: string; priority: Priority; who: string }>
}> = [
  {
    title: 'To do',
    tasks: [
      { title: 'Write onboarding copy', priority: 'Medium', who: 'AK' },
      { title: 'Audit pricing page', priority: 'Low', who: 'JM' },
    ],
  },
  {
    title: 'In progress',
    tasks: [
      { title: 'Fix login redirect', priority: 'High', who: 'SR' },
      { title: 'Design settings page', priority: 'Medium', who: 'AK' },
    ],
  },
  {
    title: 'Completed',
    tasks: [{ title: 'Set up project board', priority: 'Low', who: 'JM' }],
  },
]

const messages = [
  { who: 'SR', text: 'Login fix is up for review.' },
  { who: 'AK', text: 'Nice, I will test it after lunch.' },
]

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'size-1.5 rounded-full',
          priority === 'High' && 'bg-primary',
          priority === 'Medium' && 'bg-foreground/50',
          priority === 'Low' && 'bg-foreground/20',
        )}
      />
      {priority}
    </span>
  )
}

export function Initials({ children }: { children: string }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
      {children}
    </span>
  )
}

export function ProductMockup() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card overflow-hidden select-none"
    >
      {/* Window bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="ml-3 text-xs text-muted-foreground">
          Website Relaunch
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_240px]">
        {/* Board */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
          {columns.map((col) => (
            <div key={col.title} className="rounded-xl bg-background/60 p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-foreground">
                  {col.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <div
                    key={task.title}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <p
                      className={cn(
                        'text-sm text-foreground mb-2',
                        col.title === 'Completed' &&
                          'line-through text-muted-foreground',
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <PriorityDot priority={task.priority} />
                      <Initials>{task.who}</Initials>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="hidden md:flex flex-col border-l border-border p-4">
          <span className="text-xs font-medium text-foreground mb-3">
            Project chat
          </span>
          <div className="space-y-3 flex-1">
            {messages.map((m) => (
              <div key={m.text} className="flex items-start gap-2">
                <Initials>{m.who}</Initials>
                <p className="rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
            Message the team…
          </div>
        </div>
      </div>
    </div>
  )
}
