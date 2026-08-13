import React from 'react'
import { Search } from 'lucide-react'
import { cn } from '#/lib/utils'

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={ref}
          className={cn(
            'w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition-all',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'
