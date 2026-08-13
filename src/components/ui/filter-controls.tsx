import {
  Select,
  SelectContent,
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
        <Select key={index} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-[160px] h-10 bg-[#172318] border-[#2D3B2A] text-white text-sm focus:ring-[#68EF3F]/40">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent className="bg-[#172318] border-[#2D3B2A] text-white">
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="focus:bg-[#1F331D] focus:text-white">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
