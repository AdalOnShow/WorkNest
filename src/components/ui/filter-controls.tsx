import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterDefinition {
  label: string
  options: FilterOption[]
  value?: string
  onChange: (value: string) => void
}

export interface FilterControlsProps {
  filters: FilterDefinition[]
  className?: string
}

export function FilterControls({ filters, className }: FilterControlsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {filters.map((filter, index) => (
        <Select
          key={index}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger
            aria-label={filter.label}
            className="w-[160px] h-10 bg-card border-border text-foreground text-sm focus:ring-ring/40"
          >
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectGroup>
              {filter.options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-accent focus:text-accent-foreground"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
