import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { Container, Reveal, SectionHeading } from './reveal'

const FACTS = [
  {
    eyebrow: 'No servers',
    text: 'A single Cloudflare Worker serves the pages and the API, close to wherever your team is.',
  },
  {
    eyebrow: 'Chat that sleeps',
    text: 'Each chat room hibernates between messages. History loads from D1 without waking it up.',
  },
  {
    eyebrow: 'Checked on every call',
    text: 'Every server function looks up your role on that project before it reads or writes anything.',
  },
]

const STACK = [
  'TanStack Start',
  'Better Auth',
  'Drizzle ORM',
  'Cloudflare D1',
  'Durable Objects',
]

function Node({
  label,
  title,
  detail,
}: {
  label: string
  title: string
  detail: string
}) {
  return (
    <div className="chamfer bg-border p-px [--cut:10px]">
      <div className="chamfer h-full bg-background px-4 py-4 [--cut:10px]">
        <p className="eyebrow">{label}</p>
        <p className="mt-2 text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  )
}

/**
 * Hairline arrow. `flow` is vertical on small screens and horizontal from
 * `md` up; `down` stays vertical at every width.
 */
function Connector({
  label,
  direction = 'flow',
}: {
  label?: ReactNode
  direction?: 'flow' | 'down'
}) {
  const flow = direction === 'flow'
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center py-1',
        flow && 'md:px-1 md:py-0',
      )}
    >
      <div
        className={cn(
          'relative flex h-8 w-px items-center justify-center bg-border',
          flow && 'md:h-px md:w-full',
        )}
      >
        <span
          className={cn(
            'absolute -bottom-px left-1/2 size-1.5 -translate-x-1/2 rotate-45 border-r border-b border-border',
            flow &&
              'md:top-1/2 md:right-0 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:-rotate-45',
          )}
        />
        {label && (
          <span
            className={cn(
              'absolute left-3 bg-background px-1 font-mono text-[10px] whitespace-nowrap text-muted-foreground',
              flow && 'md:-top-5 md:left-1/2 md:-translate-x-1/2',
            )}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export function UnderTheHood() {
  return (
    <section id="stack" className="scroll-mt-24 pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="Under the hood"
          title="One Worker, at the edge"
          description="WorkNest runs entirely on Cloudflare. There are no servers to manage and nothing idles while your team is offline."
        />

        <Reveal>
          <div className="grid md:grid-cols-[1fr_minmax(48px,80px)_1.2fr_minmax(48px,80px)_1fr] md:items-center">
            <Node
              label="Client"
              title="Browser"
              detail="React UI with cached queries"
            />
            <Connector label="HTTPS" />
            <Node
              label="Compute"
              title="Cloudflare Worker"
              detail="TanStack Start pages and server functions"
            />
            <Connector label="SQL" />
            <Node
              label="Data"
              title="D1 · SQLite"
              detail="Projects, tasks, comments, activity"
            />
          </div>

          <div className="grid md:grid-cols-[1fr_minmax(48px,80px)_1.2fr_minmax(48px,80px)_1fr]">
            <div className="md:col-start-3">
              <Connector
                direction="down"
                label={
                  <>
                    <span className="md:hidden">Worker → </span>WebSocket
                  </>
                }
              />
              <Node
                label="Real time"
                title="Durable Object"
                detail="One chat room per project, hibernating when idle"
              />
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 border-t border-border/60 pt-10 md:grid-cols-3">
          {FACTS.map((f, i) => (
            <Reveal key={f.eyebrow} delay={i * 80}>
              <p className="eyebrow">{f.eyebrow}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground">
                {f.text}
              </p>
            </Reveal>
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
          {STACK.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
