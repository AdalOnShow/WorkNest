import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const themes = ['dark', 'light', 'system'] as const
type ThemeName = (typeof themes)[number]

function isThemeName(value: string | undefined): value is ThemeName {
  return themes.includes(value as ThemeName)
}
const icons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}
const labels = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [animating, setAnimating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // next-themes reports `undefined` until it has read the stored theme.
  const current: ThemeName = isThemeName(theme) ? theme : 'system'
  const nextTheme =
    themes[(themes.indexOf(current) + 1) % themes.length] ?? 'system'
  const Icon = icons[current]

  const handleToggle = () => {
    setAnimating(true)

    // Delay theme change for animation
    setTimeout(() => {
      setTheme(nextTheme)
    }, 200)

    // Remove animation class after it completes
    setTimeout(() => {
      setAnimating(false)
    }, 500)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('text-muted-foreground', className)}
        disabled
      >
        <Monitor className="w-5 h-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      title={labels[current]}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
        animating && 'pointer-events-none',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex transition-transform duration-300',
          animating && 'animate-[theme-spin_0.5s_cubic-bezier(0.4,0,0.2,1)]',
        )}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="sr-only">
        Theme: {labels[current]} — click for {labels[nextTheme]}
      </span>
    </Button>
  )
}
