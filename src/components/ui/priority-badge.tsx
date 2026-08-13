import { Badge } from '#/components/ui/badge'
import type { BadgeProps } from '#/components/ui/badge'
import { cn } from '#/lib/utils'

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: 'bg-[var(--color-priority-high)]',
  MEDIUM: 'bg-[var(--color-priority-medium)]',
  LOW: 'bg-[var(--color-priority-low)]',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: Priority
}

export function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border-border bg-card text-foreground',
        className
      )}
      {...props}
    >
      <div className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[priority])} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}
