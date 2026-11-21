import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useScrollAnimation } from '#/hooks/use-scroll-animation'
import { cn } from '#/lib/utils'
import { Container, SectionHeading } from './reveal'

// Product facts, not marketing outcomes: each figure is something WorkNest does today.
const STATS = [
  {
    value: 3,
    label: 'Roles per project',
    detail:
      'Admin, Project Manager and Team Member, set separately on every project.',
  },
  {
    value: 7,
    suffix: 'days',
    label: 'Invite link lifetime',
    detail:
      'Each invite carries its role and expires on its own, so stale links do not linger.',
  },
  {
    value: 1,
    label: 'Chat room per project',
    detail:
      'Messages arrive in real time and the full history stays next to the work.',
  },
]

/**
 * Odometer digit: a strip of 0–9 followed by 0–value, rolled up so it spins
 * through a full turn before landing on the value.
 */
function RollingDigit({
  value,
  active,
  delayMs,
}: {
  value: number
  active: boolean
  delayMs: number
}) {
  const strip = [
    ...Array.from({ length: 10 }, (_, i) => i),
    ...Array.from({ length: value + 1 }, (_, i) => i),
  ]
  const last = strip.length - 1
  return (
    <span className="stats-digit">
      <span
        className="stats-digit-strip"
        style={
          {
            '--stop': active ? last : 0,
            transitionDelay: active ? `${delayMs}ms` : '0ms',
          } as CSSProperties
        }
      >
        {strip.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}

function StatColumn({
  stat,
  index,
  visible,
}: {
  stat: (typeof STATS)[number]
  index: number
  visible: boolean
}) {
  // Bumping the key remounts the digit at 0, then it rolls again on hover
  const [spin, setSpin] = useState(0)
  const [rolled, setRolled] = useState(true)
  const delay = 200 + index * 150

  const replay = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setRolled(false)
    setSpin((s) => s + 1)
    requestAnimationFrame(() => requestAnimationFrame(() => setRolled(true)))
  }

  return (
    <div
      onPointerEnter={(e) => e.pointerType === 'mouse' && replay()}
      className={cn(
        'stats-col group relative border-b border-border/60 py-8 md:border-b-0 md:px-8 md:py-10 md:first:pl-0',
        visible && 'is-visible',
      )}
      style={{ '--col-delay': `${delay}ms` } as CSSProperties}
    >
      {/* Column divider that draws downward (md+) */}
      {index > 0 && <span aria-hidden="true" className="stats-divider" />}
      {/* Accent line that sweeps across the top on hover */}
      <span aria-hidden="true" className="stats-accent" />

      <p className="flex items-start gap-3 font-serif text-5xl leading-none tracking-[-0.02em] text-foreground lg:text-[3.75rem]">
        <RollingDigit
          key={spin}
          value={stat.value}
          active={visible && rolled}
          delayMs={spin === 0 ? delay : 0}
        />
        {stat.suffix && <span className="stats-suffix">{stat.suffix}</span>}
      </p>
      <p className="stats-rise mt-5 text-sm font-semibold tracking-tight text-foreground">
        {stat.label}
      </p>
      <p className="stats-rise stats-rise-late mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {stat.detail}
      </p>
    </div>
  )
}

export function Stats() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.3,
  })

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="By design"
          title="Built around how small teams actually work"
        />
        <div
          ref={ref}
          className={cn(
            'stats-grid relative grid md:grid-cols-3',
            isVisible && 'is-visible',
          )}
        >
          <span aria-hidden="true" className="stats-rule" />
          {STATS.map((s, i) => (
            <StatColumn key={s.label} stat={s} index={i} visible={isVisible} />
          ))}
        </div>
      </Container>
    </section>
  )
}
