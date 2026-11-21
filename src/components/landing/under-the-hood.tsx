import { Boxes, Braces, Database, Layers, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { Container, Reveal, SectionHeading } from './reveal'
import { ScrambleText } from './scramble-text'

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

const STACK: Array<{ name: string; icon: LucideIcon }> = [
  { name: 'TanStack Start', icon: Layers },
  { name: 'Better Auth', icon: ShieldCheck },
  { name: 'Drizzle ORM', icon: Braces },
  { name: 'Cloudflare D1', icon: Database },
  { name: 'Durable Objects', icon: Boxes },
]

type NodeId = 'browser' | 'worker' | 'd1' | 'do'
type LinkId = 'http' | 'sql' | 'ws'
type NodeState = 'idle' | 'active' | 'linked'

/** Which wires touch each node; hovering a node lights these up. */
const LINKS: Record<LinkId, [NodeId, NodeId]> = {
  http: ['browser', 'worker'],
  sql: ['worker', 'd1'],
  ws: ['worker', 'do'],
}

function linksOf(node: NodeId | null): Array<LinkId> {
  if (!node) return []
  return (Object.keys(LINKS) as Array<LinkId>).filter((l) =>
    LINKS[l].includes(node),
  )
}

function Node({
  id,
  label,
  title,
  detail,
  state,
  onHover,
}: {
  id: NodeId
  label: string
  title: string
  detail: string
  state: NodeState
  onHover: (id: NodeId | null) => void
}) {
  return (
    <div
      data-state={state}
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(null)}
      className="uth-node chamfer bg-border p-px [--cut:10px]"
    >
      <div className="chamfer h-full bg-background px-4 py-4 [--cut:10px]">
        <p className="uth-node-label eyebrow">{label}</p>
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
 * `md` up; `down` stays vertical at every width. When active, a packet
 * travels along it.
 */
function Connector({
  label,
  active,
  direction = 'flow',
}: {
  label?: ReactNode
  active: boolean
  direction?: 'flow' | 'down'
}) {
  const flow = direction === 'flow'
  return (
    <div
      aria-hidden="true"
      data-active={active || undefined}
      data-direction={direction}
      className={cn(
        'uth-wire flex items-center justify-center py-1',
        flow && 'md:px-1 md:py-0',
      )}
    >
      <div
        className={cn(
          'uth-wire-line relative flex h-8 w-px items-center justify-center bg-border',
          flow && 'md:h-px md:w-full',
        )}
      >
        <span className="uth-packet" />
        <span
          className={cn(
            'uth-wire-head absolute -bottom-px left-1/2 size-1.5 -translate-x-1/2 rotate-45 border-r border-b border-border',
            flow &&
              'md:top-1/2 md:right-0 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:-rotate-45',
          )}
        />
        {label && (
          <span
            className={cn(
              'uth-wire-label absolute left-3 bg-background px-1 font-mono text-[10px] whitespace-nowrap text-muted-foreground',
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
  const [hovered, setHovered] = useState<NodeId | null>(null)
  const activeLinks = linksOf(hovered)
  const nodeState = (id: NodeId): NodeState =>
    hovered === id
      ? 'active'
      : activeLinks.some((l) => LINKS[l].includes(id))
        ? 'linked'
        : 'idle'
  const node = (id: NodeId) => ({
    id,
    state: nodeState(id),
    onHover: setHovered,
  })

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
              {...node('browser')}
              label="Client"
              title="Browser"
              detail="React UI with cached queries"
            />
            <Connector label="HTTPS" active={activeLinks.includes('http')} />
            <Node
              {...node('worker')}
              label="Compute"
              title="Cloudflare Worker"
              detail="TanStack Start pages and server functions"
            />
            <Connector label="SQL" active={activeLinks.includes('sql')} />
            <Node
              {...node('d1')}
              label="Data"
              title="D1 · SQLite"
              detail="Projects, tasks, comments, activity"
            />
          </div>

          <div className="grid md:grid-cols-[1fr_minmax(48px,80px)_1.2fr_minmax(48px,80px)_1fr]">
            <div className="md:col-start-3">
              <Connector
                direction="down"
                active={activeLinks.includes('ws')}
                label={
                  <>
                    <span className="md:hidden">Worker → </span>WebSocket
                  </>
                }
              />
              <Node
                {...node('do')}
                label="Real time"
                title="Durable Object"
                detail="One chat room per project, hibernating when idle"
              />
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {FACTS.map((f, i) => (
            <Reveal key={f.eyebrow} delay={i * 80}>
              <div className="uth-fact relative pt-4">
                <span aria-hidden="true" className="uth-fact-rule" />
                <p className="uth-fact-label eyebrow">
                  <span className="mr-2 font-mono text-muted-foreground/60">
                    0{i + 1}
                  </span>
                  {f.eyebrow}
                </p>
                <p className="uth-fact-text mt-3 text-[13px] leading-relaxed text-foreground">
                  {f.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-2.5">
          {STACK.map(({ name, icon: Icon }) => (
            <li
              key={name}
              className="group chamfer bg-border p-px transition-all duration-300 ease-out [--cut:7px] hover:-translate-y-0.5 hover:bg-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="chamfer flex items-center gap-2 bg-background py-1.5 pr-3.5 pl-2 [--cut:7px]">
                <span className="flex size-6 items-center justify-center rounded-[3px] bg-muted text-muted-foreground transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-12 motion-reduce:transition-none"
                  />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                  <ScrambleText text={name} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
