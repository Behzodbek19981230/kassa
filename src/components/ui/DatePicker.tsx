import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  /** ISO date string (`YYYY-MM-DD`), matching the native `<input type="date">` contract. */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function parseISODate(value?: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

export function DatePicker({ value, onChange, placeholder = 'Sanani tanlang...', disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const registerSurface = useDismissableLayerSurface()

  const selected = parseISODate(value)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type='button'
          disabled={disabled}
          className={cn(
            'flex h-[34px] w-full items-center gap-2 rounded-[3px] border border-[#ccd0d4] bg-white px-3 text-xs text-ca-heading',
            'focus:border-[#9fa2a5] focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
            className,
          )}
        >
          <FaCalendarAlt className='shrink-0 text-ca-text' />
          <span className={cn('truncate text-left', !selected && 'text-ca-text')}>
            {selected ? toDisplayDate(selected) : placeholder}
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={registerSurface}
          align='start'
          sideOffset={4}
          className='z-[1070] overflow-hidden rounded-[3px] border border-ca-border bg-white p-2 text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]'
        >
          <DayPicker
            mode='single'
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) return
              onChange?.(toISODate(date))
              setOpen(false)
            }}
            showOutsideDays
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? <FaChevronLeft className='text-[10px]' /> : <FaChevronRight className='text-[10px]' />,
            }}
            classNames={{
              root: 'text-ca-heading',
              months: '',
              month: 'space-y-2',
              month_caption: 'flex items-center justify-center py-1 text-xs font-semibold text-ca-heading',
              caption_label: '',
              nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-1',
              button_previous: 'flex h-6 w-6 items-center justify-center rounded-[3px] text-ca-text hover:bg-ca-silver disabled:opacity-30',
              button_next: 'flex h-6 w-6 items-center justify-center rounded-[3px] text-ca-text hover:bg-ca-silver disabled:opacity-30',
              month_grid: 'w-full border-collapse',
              weekdays: '',
              weekday: 'w-8 pb-1 text-center text-[10px] font-semibold text-ca-text',
              week: '',
              day: 'p-0 text-center',
              day_button: 'flex h-8 w-8 items-center justify-center rounded-[3px] text-xs text-ca-heading hover:bg-ca-silver',
              selected: '[&>button]:bg-ca-theme [&>button]:text-white [&>button]:hover:bg-ca-theme-dark',
              today: '[&>button]:border [&>button]:border-ca-theme',
              outside: '[&>button]:text-ca-text/50',
              disabled: '[&>button]:opacity-30 [&>button]:pointer-events-none',
              hidden: 'invisible',
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
