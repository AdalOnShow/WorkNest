import { AlertTriangle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export interface ErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center px-4 rounded-xl border border-border bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-center size-12 rounded-xl bg-destructive/10 mb-4">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-border bg-transparent text-foreground hover:bg-accent"
        >
          Try again
        </Button>
      )}
    </div>
  )
}
