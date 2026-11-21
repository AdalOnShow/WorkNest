import { useEffect, useRef, useState } from 'react'
import { cn } from '#/lib/utils'

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$01ABCDEFXZ'
const FRAME_MS = 32
const MS_PER_CHAR = 70
const MIN_DURATION_MS = 380

const randomGlyph = () =>
  GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#'

/**
 * One word that scrambles into random glyphs on hover, then decodes back
 * left to right. Each glyph sits over an invisible copy of the real
 * character, so the layout never shifts.
 */
function ScrambleWord({ word }: { word: string }) {
  const chars = Array.from(word)
  // null = show the real character; string = show this glyph instead
  const [glyphs, setGlyphs] = useState<Array<string | null>>(() =>
    chars.map(() => null),
  )
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => clearInterval(timer.current), [])

  const run = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearInterval(timer.current)
    const duration = Math.max(MIN_DURATION_MS, chars.length * MS_PER_CHAR)
    const start = performance.now()
    timer.current = setInterval(() => {
      const progress = (performance.now() - start) / duration
      // Reveal front moves left to right; the lead-in scrambles every char first
      const revealed = Math.floor((progress * 1.2 - 0.2) * chars.length)
      setGlyphs(chars.map((_, i) => (i < revealed ? null : randomGlyph())))
      if (progress >= 1) {
        clearInterval(timer.current)
        setGlyphs(chars.map(() => null))
      }
    }, FRAME_MS)
  }

  return (
    <span
      aria-hidden="true"
      onPointerEnter={run}
      className="inline-block whitespace-nowrap"
    >
      {chars.map((char, i) => {
        const glyph = glyphs[i]
        return (
          <span key={i} className="inline-grid">
            <span
              className={cn('col-start-1 row-start-1', glyph && 'invisible')}
            >
              {char}
            </span>
            {glyph && (
              <span className="col-start-1 row-start-1 self-center justify-self-center font-mono text-[0.6em] text-primary">
                {glyph}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** Text where each word scrambles and decodes on its own when hovered. */
export function ScrambleText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const words = text.split(' ')
  return (
    <span aria-label={text} className={cn('cursor-default', className)}>
      {words.map((word, i) => (
        <span key={i}>
          <ScrambleWord word={word} />
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
