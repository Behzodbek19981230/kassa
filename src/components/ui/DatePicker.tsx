import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useState } from 'react'
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

const currentYear = new Date().getFullYear()
const CALENDAR_START_MONTH = new Date(currentYear - 100, 0, 1)
const CALENDAR_END_MONTH = new Date(currentYear + 1, 11, 31)

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

function parseDisplayDate(text: string): Date | undefined {
  const match = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined
  return date
}

export function DatePicker({ value, onChange, placeholder = 'kk.oo.yyyy', disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const registerSurface = useDismissableLayerSurface()

  const selected = parseISODate(value)
  const [text, setText] = useState(() => (selected ? toDisplayDate(selected) : ''))

  useEffect(() => {
    setText(selected ? toDisplayDate(selected) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commitText = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setText('')
      if (value) onChange?.('')
      return
    }
    const date = parseDisplayDate(trimmed)
    if (date) {
      setText(toDisplayDate(date))
      onChange?.(toISODate(date))
    } else {
      setText(selected ? toDisplayDate(selected) : '')
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverPrimitive.Anchor asChild>
        <div
          className={cn(
            'flex h-[34px] w-full items-center gap-2 rounded-[3px] border border-[#ccd0d4] bg-white px-3 text-xs text-ca-heading',
            'focus-within:border-[#9fa2a5]',
            disabled && 'cursor-not-allowed bg-[#e5e9ed] opacity-60',
            className,
          )}
        >
          <input
            type='text'
            inputMode='numeric'
            value={text}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            className='min-w-0 flex-1 bg-transparent text-xs text-ca-heading placeholder:text-ca-text focus:outline-none disabled:cursor-not-allowed'
          />
          <PopoverPrimitive.Trigger asChild>
            <button
              type='button'
              disabled={disabled}
              className='shrink-0 text-ca-text hover:text-ca-heading disabled:cursor-not-allowed'
            >
              <FaCalendarAlt />
            </button>
          </PopoverPrimitive.Trigger>
        </div>
      </PopoverPrimitive.Anchor>
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
            captionLayout='dropdown'
            startMonth={CALENDAR_START_MONTH}
            endMonth={CALENDAR_END_MONTH}
            onSelect={(date) => {
              if (!date) return
              setText(toDisplayDate(date))
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
              month_caption: 'flex items-center justify-center gap-1 py-1 text-xs font-semibold text-ca-heading',
              caption_label: 'hidden',
              dropdowns: 'flex items-center gap-1',
              dropdown_root: 'relative inline-flex',
              dropdown: 'h-6 cursor-pointer rounded-[3px] border border-[#ccd0d4] bg-white pl-1 pr-0.5 text-xs text-ca-heading focus:border-[#9fa2a5] focus:outline-none',
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
