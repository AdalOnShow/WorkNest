import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Bell, Check, Mail } from 'lucide-react'
import { useScrollAnimation } from '#/hooks/use-scroll-animation'
import { cn } from '#/lib/utils'
import { Initials, PriorityDot } from './product-mockup'
import { Container, SectionHeading } from './reveal'

const STEP_MS = 5000

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

/* ---------- Step visuals ---------- */

function useTypewriter(text: string, startMs = 300, speedMs = 70) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length)
      return
    }
    let interval: ReturnType<typeof setInterval> | undefined
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval)
            return c
          }
          return c + 1
        })
      }, speedMs)
    }, startMs)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [text, startMs, speedMs])
  return text.slice(0, count)
}

function SignInVisual() {
  return (
    <div className="mx-auto w-full max-w-xs text-center">
      <p className="hiw-rise text-lg font-semibold text-foreground mb-1">
        Welcome to WorkNest
      </p>
      <p
        className="hiw-rise text-sm text-muted-foreground mb-6"
        style={delay(100)}
      >
        Sign in to continue
      </p>
      <div className="space-y-2.5">
        <div
          className="hiw-rise rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
          style={delay(300)}
        >
          Continue with Google
        </div>
        <div
          className="hiw-rise relative rounded-lg border border-primary bg-background px-4 py-2.5 text-sm text-foreground"
          style={delay(450)}
        >
          Continue with GitHub
        </div>
      </div>
      <div
        className="hiw-pop mt-6 inline-flex items-center gap-2 rounded-md bg-lime px-3 py-1.5 text-xs font-semibold text-lime-foreground"
        style={delay(1400)}
      >
        <Check className="size-3.5" /> Signed in as Sam
      </div>
    </div>
  )
}

function CreateProjectVisual() {
  const name = useTypewriter('Website Relaunch')
  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      <p className="hiw-rise text-sm font-semibold text-foreground">
        New project
      </p>
      <div className="hiw-rise" style={delay(100)}>
        <p className="text-xs text-muted-foreground mb-1.5">Project name</p>
        <div className="rounded-lg border border-primary bg-background px-3 py-2 text-sm text-foreground h-9">
          {name}
          <span className="hiw-caret ml-px inline-block h-4 w-0.5 translate-y-0.5 bg-primary" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="hiw-rise" style={delay(1500)}>
          <p className="text-xs text-muted-foreground mb-1.5">Deadline</p>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            Dec 15
          </div>
        </div>
        <div className="hiw-rise" style={delay(1650)}>
          <p className="text-xs text-muted-foreground mb-1.5">Status</p>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            Active
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <span
          className="hiw-pop inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          style={delay(2600)}
        >
          <Check className="size-3.5" /> You are the admin
        </span>
        <span
          className="hiw-pop rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground"
          style={delay(2100)}
        >
          Create project
        </span>
      </div>
    </div>
  )
}

function InviteVisual() {
  const invites = [
    { who: 'AK', email: 'alex@team.com', role: 'Project Manager' },
    { who: 'JM', email: 'jordan@team.com', role: 'Team Member' },
    { who: 'RT', email: 'riley@team.com', role: 'Team Member' },
  ]
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="hiw-rise flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground mb-5">
        <Mail className="size-4" /> Invite teammates
      </div>
      <div className="space-y-2.5">
        {invites.map((inv, i) => (
          <div
            key={inv.email}
            className="hiw-rise flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3"
            style={delay(400 + i * 450)}
          >
            <Initials>{inv.who}</Initials>
            <span className="flex-1 truncate text-sm text-foreground">
              {inv.email}
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {inv.role}
            </span>
          </div>
        ))}
      </div>
      <div
        className="hiw-pop mt-5 inline-flex items-center gap-2 rounded-md bg-lime px-3 py-1.5 text-xs font-semibold text-lime-foreground"
        style={delay(2000)}
      >
        <Check className="size-3.5" /> 3 invite links ready
      </div>
    </div>
  )
}

function PlanVisual() {
  const tasks = [
    { title: 'Fix login redirect', priority: 'High' as const, who: 'SR' },
    { title: 'Design settings page', priority: 'Medium' as const, who: 'AK' },
    { title: 'Write onboarding copy', priority: 'Low' as const, who: 'JM' },
  ]
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="space-y-2.5">
        {tasks.map((t, i) => (
          <div
            key={t.title}
            className="hiw-rise flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3"
            style={delay(200 + i * 300)}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center rounded-full border border-border">
              {i === 0 && (
                <span
                  className="hiw-pop absolute inset-[-1px] flex items-center justify-center rounded-full bg-primary"
                  style={delay(1800)}
                >
                  <Check className="size-3 text-primary-foreground" />
                </span>
              )}
            </span>
            <span className="flex-1 truncate text-sm text-foreground">
              {t.title}
            </span>
            <PriorityDot priority={t.priority} />
            <Initials>{t.who}</Initials>
          </div>
        ))}
      </div>
      <div className="hiw-rise mt-6" style={delay(1200)}>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>1 of 3 done</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="hiw-progress h-full w-1/3 rounded-full bg-primary"
            style={{ animationDuration: '600ms', ...delay(1900) }}
          />
        </div>
      </div>
    </div>
  )
}

function SyncVisual() {
  const messages = [
    { who: 'JM', name: 'Jordan', text: 'Login fix is ready for review' },
    { who: 'AK', name: 'Alex', text: 'Checking it now' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="hiw-pop mb-5 flex items-start gap-2.5 rounded-lg border border-border/60 bg-background p-3"
        style={delay(1900)}
      >
        <Bell className="size-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-sm text-foreground">Task completed</p>
          <p className="text-xs text-muted-foreground">
            Sam completed “Fix login redirect”
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div
            key={m.text}
            className="hiw-rise flex items-start gap-2.5"
            style={delay(200 + i * 600)}
          >
            <Initials>{m.who}</Initials>
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-xs font-semibold text-foreground">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.text}</p>
            </div>
          </div>
        ))}
        <div className="hiw-rise flex items-center gap-2.5" style={delay(1300)}>
          <Initials>SR</Initials>
          <div className="flex gap-1 rounded-lg bg-muted px-3 py-3">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="hiw-bounce size-1.5 rounded-full bg-muted-foreground"
                style={delay(d)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Steps ---------- */

const steps: Array<{
  title: string
  description: string
  label: string
  visual: () => ReactNode
}> = [
  {
    title: 'Sign in',
    description:
      'Use your Google or GitHub account. There are no passwords to create or remember.',
    label: 'worknest.app/login',
    visual: SignInVisual,
  },
  {
    title: 'Create a project',
    description:
      'Give it a name, a description and a deadline. You become the project admin.',
    label: 'New project',
    visual: CreateProjectVisual,
  },
  {
    title: 'Invite your team',
    description:
      'Create an invite link for each teammate, choose their role and share the link with them.',
    label: 'Website Relaunch / Members',
    visual: InviteVisual,
  },
  {
    title: 'Plan the work',
    description:
      'Add tasks with a priority, a due date and an assignee. Move them from To do to Completed.',
    label: 'Website Relaunch / Tasks',
    visual: PlanVisual,
  },
  {
    title: 'Stay in sync',
    description:
      'Talk in the project chat, comment on tasks and follow progress on your dashboard.',
    label: 'Website Relaunch / Chat',
    visual: SyncVisual,
  },
]

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: false,
  })

  const running = isVisible && !paused
  const current = steps[active]
  if (!current) return null
  const Visual = current.visual

  return (
    <section id="platform" className="scroll-mt-24 pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="Platform"
          title="Total visibility across every project"
          description="Sign in, set up a project and bring your team in. Each step shows the screen you will see."
        />

        <div
          ref={ref}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          className="grid gap-8 lg:grid-cols-2 lg:gap-12"
        >
          {/* Step list */}
          <ol className="relative border-t border-border/60">
            {steps.map((step, i) => {
              const isActive = i === active
              const isDone = i < active
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'group relative w-full overflow-hidden border-b border-border/60 py-5 pr-2 text-left transition-colors duration-200',
                      !isActive && 'hover:bg-muted/30',
                    )}
                  >
                    <div className="flex gap-4">
                      <span
                        className={cn(
                          'flex h-6 w-8 shrink-0 items-center font-mono text-[11px] tabular-nums transition-colors duration-200',
                          isActive || isDone
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {isDone ? (
                          <Check className="size-3.5" />
                        ) : (
                          String(i + 1).padStart(2, '0')
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3
                          className={cn(
                            'text-lg font-semibold tracking-tight transition-colors duration-200',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {step.title}
                        </h3>
                        {isActive && (
                          <p className="hiw-rise mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-px h-px overflow-hidden bg-border">
                        <span
                          key={active}
                          className="hiw-progress block h-full bg-primary"
                          style={{
                            animationDuration: `${STEP_MS}ms`,
                            animationPlayState: running ? 'running' : 'paused',
                          }}
                          onAnimationEnd={() =>
                            setActive((a) => (a + 1) % steps.length)
                          }
                        />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>

          {/* Live preview */}
          <div
            aria-hidden="true"
            className="relative flex flex-col bg-border p-px select-none"
          >
            <div className="flex h-9 items-center gap-2 border-b border-border/60 bg-background px-4">
              <span
                key={active}
                className="hiw-rise truncate font-mono text-[11px] text-muted-foreground"
              >
                {current.label}
              </span>
            </div>
            <div className="flex min-h-[340px] flex-1 items-center bg-background px-6 py-8">
              {isVisible && <Visual key={active} />}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
