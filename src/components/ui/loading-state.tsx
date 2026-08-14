import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'

export interface LoadingStateProps {
  variant: 'table' | 'cards' | 'detail' | 'list'
  className?: string
}

export function LoadingState({ variant, className }: LoadingStateProps) {
  if (variant === 'table') {
    return (
      <div
        className={cn(
          'rounded-xl border border-[#2D3B2A] bg-[#172318] p-4 space-y-4',
          className,
        )}
      >
        <Skeleton className="h-10 w-full bg-[#1F331D]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-[#1F331D]/50" />
        ))}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
          className,
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#2D3B2A] bg-[#172318] p-6 space-y-3"
          >
            <Skeleton className="h-4 w-1/2 bg-[#1F331D]" />
            <Skeleton className="h-8 w-1/3 bg-[#1F331D]" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-10 w-1/3 bg-[#1F331D]" />
        <div className="rounded-xl border border-[#2D3B2A] bg-[#172318] p-8 space-y-4">
          <Skeleton className="h-6 w-full bg-[#1F331D]" />
          <Skeleton className="h-6 w-5/6 bg-[#1F331D]" />
          <Skeleton className="h-6 w-4/6 bg-[#1F331D]" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[#2D3B2A] bg-[#172318] p-4"
        >
          <Skeleton className="h-12 w-12 rounded-full bg-[#1F331D]" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/4 bg-[#1F331D]" />
            <Skeleton className="h-4 w-1/2 bg-[#1F331D]" />
          </div>
        </div>
      ))}
    </div>
  )
}
