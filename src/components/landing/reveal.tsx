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
        'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/** Shared page width for every landing section. */
export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: {
  eyebrow: string
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}) {
  return (
    <Reveal
      className={cn(
        'mb-12 max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="text-3xl leading-[1.12] text-balance text-foreground sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </Reveal>
  )
}
