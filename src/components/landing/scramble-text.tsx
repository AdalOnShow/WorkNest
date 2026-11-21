import { useEffect, useRef, useState } from 'react'
import { cn } from '#/lib/utils'

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$01ABCDEFXZ'
const FRAME_MS = 32
const DURATION_MS = 900

const randomGlyph = () =>
  GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#'

/**
 * Text that scrambles into random glyphs on hover, then decodes back
 * left to right. Each glyph sits over an invisible copy of the real
 * character, so the layout never shifts.
 */
export function ScrambleText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  // null = show the real character; string = show this glyph instead
  const [glyphs, setGlyphs] = useState<Array<string | null>>(() =>
    Array.from(text, () => null),
  )
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => clearInterval(timer.current), [])

  const run = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearInterval(timer.current)
    const chars = Array.from(text)
    const start = performance.now()
    timer.current = setInterval(() => {
      const progress = (performance.now() - start) / DURATION_MS
      // Reveal front moves left to right; a little lead-in keeps every char scrambling first
      const revealed = Math.floor((progress * 1.15 - 0.15) * chars.length)
      setGlyphs(
        chars.map((c, i) => (c === ' ' || i < revealed ? null : randomGlyph())),
      )
      if (progress >= 1) {
        clearInterval(timer.current)
        setGlyphs(chars.map(() => null))
      }
    }, FRAME_MS)
  }

  // Group characters into words so lines still only wrap at spaces
  const words: Array<Array<{ char: string; index: number }>> = []
  let index = 0
  for (const word of text.split(' ')) {
    words.push(Array.from(word, (char) => ({ char, index: index++ })))
    index++ // the space
  }

  return (
    <span
      aria-label={text}
      onPointerEnter={run}
      className={cn('cursor-default', className)}
    >
      {words.map((word, w) => (
        <span key={w} aria-hidden="true">
          <span className="whitespace-nowrap">
            {word.map(({ char, index: i }) => {
              const glyph = glyphs[i]
              return (
                <span key={i} className="inline-grid">
                  <span
                    className={cn(
                      'col-start-1 row-start-1',
                      glyph && 'invisible',
                    )}
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
          {w < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
