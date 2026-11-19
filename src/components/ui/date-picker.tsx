import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'

interface DatePickerProps {
  /** `YYYY-MM-DD`, or an empty string for no date. */
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  /** Disable days before today. */
  disablePast?: boolean
  className?: string
}

function toDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toValue(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** shadcn Calendar in a popover. Keeps the `YYYY-MM-DD` string contract of `<input type="date">`. */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'Pick a date',
  disablePast,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start gap-2 bg-background border-border font-normal rounded-lg',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="flex-1 text-left truncate">
            {selected
              ? selected.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : placeholder}
          </span>
          {selected && (
            <span
              role="button"
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            onChange(d ? toValue(d) : '')
            setOpen(false)
          }}
          disabled={disablePast ? { before: today } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
