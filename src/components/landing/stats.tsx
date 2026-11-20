import { Container, Reveal, SectionHeading } from './reveal'

// Product facts, not marketing outcomes: each figure is something WorkNest does today.
const STATS = [
  {
    value: '3',
    label: 'Roles per project',
    detail:
      'Admin, Project Manager and Team Member, set separately on every project.',
  },
  {
    value: '7 days',
    label: 'Invite link lifetime',
    detail:
      'Each invite carries its role and expires on its own, so stale links do not linger.',
  },
  {
    value: '1',
    label: 'Chat room per project',
    detail:
      'Messages arrive in real time and the full history stays next to the work.',
  },
]

export function Stats() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="By design"
          title="Built around how small teams actually work"
        />
        <div className="grid border-t border-border/60 md:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 80}
              className="border-b border-border/60 py-8 md:border-b-0 md:px-8 md:py-10 md:first:pl-0 md:[&:not(:first-child)]:border-l"
            >
              <p className="font-serif text-5xl leading-none tracking-[-0.02em] text-foreground lg:text-[3.75rem]">
                {s.value}
              </p>
              <p className="mt-5 text-sm font-semibold tracking-tight text-foreground">
                {s.label}
              </p>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {s.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
