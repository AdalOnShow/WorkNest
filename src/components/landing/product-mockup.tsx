import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type Priority = 'High' | 'Medium' | 'Low'

type MockTask = {
  title: string
  priority: Priority
  who: string
  due: string
}

const columns: Array<{ title: string; tasks: Array<MockTask> }> = [
  {
    title: 'To do',
    tasks: [
      {
        title: 'Write onboarding copy',
        priority: 'Medium',
        who: 'AK',
        due: 'Dec 9',
      },
      {
        title: 'Audit pricing page',
        priority: 'Low',
        who: 'JM',
        due: 'Dec 12',
      },
    ],
  },
  {
    title: 'In progress',
    tasks: [
      {
        title: 'Design settings page',
        priority: 'Medium',
        who: 'AK',
        due: 'Dec 5',
      },
      {
        title: 'Update footer links',
        priority: 'Low',
        who: 'JM',
        due: 'Dec 6',
      },
    ],
  },
  {
    title: 'Completed',
    tasks: [
      {
        title: 'Fix login redirect',
        priority: 'High',
        who: 'SR',
        due: 'Today',
      },
      {
        title: 'Set up project board',
        priority: 'Low',
        who: 'JM',
        due: 'Nov 28',
      },
    ],
  },
]

const messages = [
  { who: 'JM', name: 'Jordan', text: 'Login fix is ready for review' },
  { who: 'AK', name: 'Alex', text: 'Tested it on mobile, works for me' },
]

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
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
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
        'overflow-hidden rounded-xl border border-border bg-card select-none',
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="size-2.5 rounded-full bg-muted" />
        <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
          {path}
        </span>
      </div>
      {children}
    </div>
  )
}

function TaskCard({ task, done }: { task: MockTask; done: boolean }) {
  const isMoment = task.title === 'Fix login redirect'
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isMoment
          ? 'border-transparent bg-lime text-lime-foreground'
          : 'border-border bg-card',
      )}
    >
      <p
        className={cn(
          'mb-3 text-sm font-medium',
          isMoment
            ? 'text-lime-foreground'
            : done
              ? 'text-muted-foreground line-through'
              : 'text-foreground',
        )}
      >
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        {isMoment ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
            <Check className="size-3.5" /> Completed today
          </span>
        ) : (
          <PriorityDot priority={task.priority} />
        )}
        <span className="flex items-center gap-2">
          {!isMoment && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {task.due}
            </span>
          )}
          <Initials>{task.who}</Initials>
        </span>
      </div>
    </div>
  )
}

export function ProductMockup() {
  return (
    <PreviewFrame path="Website Relaunch / Tasks">
      <div className="grid md:grid-cols-[minmax(0,1fr)_256px]">
        {/* Board */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {columns.map((col) => (
            <div
              key={col.title}
              className={cn(
                'rounded-xl bg-background p-2',
                col.title === 'To do' && 'hidden sm:block',
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1 pt-1">
                <span className="text-xs font-semibold text-foreground">
                  {col.title}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <TaskCard
                    key={task.title}
                    task={task}
                    done={col.title === 'Completed'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="hidden flex-col border-l border-border p-4 md:flex">
          <span className="mb-4 text-xs font-semibold text-foreground">
            Project chat
          </span>
          <div className="flex-1 space-y-4">
            {messages.map((m) => (
              <div key={m.text} className="flex items-start gap-2">
                <Initials>{m.who}</Initials>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {m.name}
                  </p>
                  <p className="text-sm text-description">{m.text}</p>
                </div>
              </div>
            ))}
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              Sam completed “Fix login redirect”
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
            Message
          </div>
        </div>
      </div>
    </PreviewFrame>
  )
}
