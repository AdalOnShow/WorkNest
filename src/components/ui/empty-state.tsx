import type { LucideIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center px-4',
        className,
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#1F331D] mb-6">
        <Icon className="w-10 h-10 text-[#7A8278]" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#B8C0B5] max-w-sm mb-8">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-[#68EF3F] text-[#273F2B] hover:bg-[#5BE337] rounded-full px-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
