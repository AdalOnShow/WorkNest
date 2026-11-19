import type { ReactNode } from 'react'
import { useScrollAnimation } from '#/hooks/use-scroll-animation'
import { cn } from '#/lib/utils'

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 motion-reduce:transition-none',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <Reveal className="max-w-2xl mx-auto text-center mb-14">
      <p className="text-sm font-semibold text-primary mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </Reveal>
  )
}
