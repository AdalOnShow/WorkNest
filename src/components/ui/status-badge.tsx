import { Badge } from '#/components/ui/badge'
import type { BadgeProps } from '#/components/ui/badge'
import { cn } from '#/lib/utils'

export type Status = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'TODO'

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE: 'bg-[var(--color-status-active)]',
  IN_PROGRESS: 'bg-[var(--color-status-in-progress)]',
  COMPLETED: 'bg-[var(--color-status-completed)]',
  ON_HOLD: 'bg-[var(--color-status-on-hold)]',
  TODO: 'bg-[var(--color-status-todo)]',
}

const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: 'Active',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  TODO: 'To Do',
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: Status
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border-border bg-card text-foreground',
        className
      )}
      {...props}
    >
      <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[status])} />
      {STATUS_LABELS[status]}
    </Badge>
  )
}
