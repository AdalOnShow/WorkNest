import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const themes = ['dark', 'light', 'system'] as const
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

  const currentIndex = themes.indexOf(
    (theme as (typeof themes)[number]) ?? 'dark',
  )
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  const Icon = icons[theme as keyof typeof icons] ?? Monitor

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
      title={labels[theme as keyof typeof labels] ?? 'System'}
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
        Theme: {labels[theme as keyof typeof labels] ?? 'System'} — click for{' '}
        {labels[nextTheme]}
      </span>
    </Button>
  )
}
