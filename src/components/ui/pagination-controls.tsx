import { Button } from '#/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            className={cn(
              'w-9 h-9',
              currentPage === page
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
