import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  /** ISO date (`YYYY-MM-DD`), or `YYYY-MM-DDTHH:mm` when `showTime` is set (24-hour, same shape as `datetime-local`). */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Adds a 12-hour time picker (hour, minute, AM/PM) to the calendar popover. */
  showTime?: boolean
}

type Period = 'AM' | 'PM'
type View = 'days' | 'months' | 'years'

const currentYear = new Date().getFullYear()
const FIRST_YEAR = currentYear - 100
const LAST_YEAR = currentYear + 1
const CALENDAR_START_MONTH = new Date(FIRST_YEAR, 0, 1)
const CALENDAR_END_MONTH = new Date(LAST_YEAR, 11, 31)
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' }),
)

// 12-hour clock as in the design: 12, 01 ... 11.
const HOURS_12 = Array.from({ length: 12 }, (_, i) => pad(i === 0 ? 12 : i))
// Minutes in 5-minute steps as in the design. A typed value such as 37 is still accepted.
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => pad(i * 5))
const PERIODS: Period[] = ['AM', 'PM']

// Scrollable lists keep working with the wheel and touch, but show no scrollbar that takes up width.
const NO_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
const HEADER_BUTTON =
  'inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-xs font-semibold text-ca-heading hover:bg-ca-silver'
const NAV_BUTTON =
  'flex h-7 w-7 items-center justify-center rounded-full text-ca-text hover:bg-ca-silver disabled:pointer-events-none disabled:opacity-30'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

function toDisplayDate(date: Date): string {
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  return `${day}.${month}.${date.getFullYear()}`
}

/** 24-hour `HH` -> 12-hour `hh` and AM/PM. */
function toTwelveHour(hours24: string): { hour: string; period: Period } {
  const hours = Number(hours24)
  return { hour: pad(hours % 12 || 12), period: hours >= 12 ? 'PM' : 'AM' }
}

/** 12-hour `hh` and AM/PM -> 24-hour `HH`. */
function toTwentyFourHour(hour12: string, period: Period): string {
  return pad((Number(hour12) % 12) + (period === 'PM' ? 12 : 0))
}

interface SplitValue {
  date?: Date
  hours: string
  minutes: string
}

function timePart(part: string | undefined): string {
  return part && /^\d{1,2}$/.test(part) ? pad(Number(part)) : '00'
}

function splitValue(value?: string): SplitValue {
  const [datePart = '', time = ''] = (value ?? '').split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = time.split(':')
  return {
    date: year && month && day ? new Date(year, month - 1, day) : undefined,
    hours: timePart(hours),
    minutes: timePart(minutes),
  }
}

function formatValue(date: Date, hours: string, minutes: string, showTime: boolean): string {
  const iso = toISODate(date)
  return showTime ? `${iso}T${hours}:${minutes}` : iso
}

function toDisplayText(value: SplitValue, showTime: boolean): string {
  if (!value.date) return ''
  const day = toDisplayDate(value.date)
  if (!showTime) return day
  const { hour, period } = toTwelveHour(value.hours)
  return `${day} ${hour}:${value.minutes} ${period}`
}

interface ParsedDisplay {
  date: Date
  /** 24-hour `HH`. */
  hours?: string
  minutes?: string
}

function parseDisplayText(text: string): ParsedDisplay | undefined {
  // dd.mm.yyyy, optionally followed by hh:mm and AM/PM. Without AM/PM the hour is read as 24-hour.
  const match = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?$/i)
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined
  if (match[4] === undefined) return { date }

  const hour = Number(match[4])
  const minute = Number(match[5])
  if (minute > 59) return undefined
  const period = match[6]?.toUpperCase() as Period | undefined
  if (period) {
    if (hour < 1 || hour > 12) return undefined
    return { date, hours: toTwentyFourHour(match[4], period), minutes: pad(minute) }
  }
  if (hour > 23) return undefined
  return { date, hours: pad(hour), minutes: pad(minute) }
}

interface ScrollListProps {
  className?: string
  children: ReactNode
}

/** A scrollable list without a visible scrollbar. The selected item (`data-selected="true"`) is scrolled into view on mount. */
function ScrollList({ className, children }: ScrollListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Only the list scrolls, not the page.
  useEffect(() => {
    const list = listRef.current
    const item = list?.querySelector<HTMLElement>('[data-selected="true"]')
    if (list && item) list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2
  }, [])

  return (
    <div ref={listRef} className={cn('relative overflow-y-auto', NO_SCROLLBAR, className)}>
      {children}
    </div>
  )
}

interface TimeColumnProps {
  values: string[]
  selected: string
  onSelect: (value: string) => void
}

function TimeColumn({ values, selected, onSelect }: TimeColumnProps) {
  return (
    <ScrollList className='h-74 w-10'>
      {values.map((value) => {
        const isSelected = value === selected
        return (
          <button
            key={value}
            type='button'
            data-selected={isSelected}
            onClick={() => onSelect(value)}
            className={cn(
              'mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors',
              isSelected ? 'bg-ca-theme font-semibold text-white' : 'text-ca-heading hover:bg-ca-silver',
            )}
          >
            {value}
          </button>
        )
      })}
    </ScrollList>
  )
}

export function DatePicker({ value, onChange, placeholder, disabled, className, showTime = false }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const registerSurface = useDismissableLayerSurface()

  const current = splitValue(value)
  const selected = current.date
  const twelve = toTwelveHour(current.hours)
  const displayText = toDisplayText(current, showTime)
  const [text, setText] = useState(displayText)

  // What the calendar shows: days, the month list or the year list. The shown month is kept apart from the value.
  const [view, setView] = useState<View>('days')
  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date())
  const viewYear = viewMonth.getFullYear()
  const viewMonthIndex = viewMonth.getMonth()
  const canGoPrev = new Date(viewYear, viewMonthIndex - 1, 1) >= CALENDAR_START_MONTH
  const canGoNext = new Date(viewYear, viewMonthIndex + 1, 1) <= CALENDAR_END_MONTH

  useEffect(() => {
    setText(displayText)
  }, [displayText])

  const handleOpenChange = (next: boolean) => {
    if (disabled) return
    if (next) {
      setViewMonth(selected ?? new Date())
      setView('days')
    }
    setOpen(next)
  }

  const commitText = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setText('')
      if (value) onChange?.('')
      return
    }
    const parsed = parseDisplayText(trimmed)
    if (!parsed) {
      setText(displayText)
      return
    }
    const hours = parsed.hours ?? current.hours
    const minutes = parsed.minutes ?? current.minutes
    setText(toDisplayText({ date: parsed.date, hours, minutes }, showTime))
    onChange?.(formatValue(parsed.date, hours, minutes, showTime))
  }

  const pickDate = (date: Date) => {
    onChange?.(formatValue(date, current.hours, current.minutes, showTime))
    if (!showTime) setOpen(false)
  }

  // Picking a time before a date uses today, so the chosen time is kept.
  const pickTime = (part: { hours?: string; minutes?: string }) => {
    const date = selected ?? new Date()
    onChange?.(formatValue(date, part.hours ?? current.hours, part.minutes ?? current.minutes, true))
  }

  const pickHour = (hour: string) => pickTime({ hours: toTwentyFourHour(hour, twelve.period) })
  const pickPeriod = (period: Period) => pickTime({ hours: toTwentyFourHour(twelve.hour, period) })
  const pickMinute = (minutes: string) => pickTime({ minutes })

  const shiftMonth = (delta: number) => {
    setViewMonth(new Date(viewYear, viewMonthIndex + delta, 1))
  }

  const selectMonth = (index: number) => {
    setViewMonth(new Date(viewYear, index, 1))
    setView('days')
  }

  const selectYear = (year: number) => {
    setViewMonth(new Date(year, viewMonthIndex, 1))
    setView('days')
  }

  const pickToday = () => {
    pickDate(new Date())
  }

  const clear = () => {
    onChange?.('')
    setOpen(false)
  }

  const inputPlaceholder = placeholder ?? (showTime ? 'kk.oo.yyyy hh:mm aa' : 'kk.oo.yyyy')

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Anchor asChild>
        <div
          className={cn(
            'flex h-[34px] w-full items-center gap-2 rounded-[3px] border border-ca-field-border bg-ca-silver-light px-3 text-xs text-ca-heading',
            'focus-within:border-ca-field-border-strong',
            disabled && 'cursor-not-allowed bg-ca-muted-2 opacity-60',
            className,
          )}
        >
          <input
            type='text'
            inputMode='numeric'
            value={text}
            disabled={disabled}
            placeholder={inputPlaceholder}
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
          className='z-[1070] overflow-hidden rounded-[3px] border border-ca-border bg-ca-silver-light p-3 text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]'
        >
          <div className='flex'>
            <div className='w-56'>
              <div className='mb-2 flex h-8 items-center justify-between'>
                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => setView(view === 'months' ? 'days' : 'months')}
                    className={cn(HEADER_BUTTON, view === 'months' && 'bg-ca-silver')}
                  >
                    {MONTH_NAMES[viewMonthIndex]}
                    <FaChevronDown className={cn('text-[10px] text-ca-text transition-transform', view === 'months' && 'rotate-180')} />
                  </button>
                  <button
                    type='button'
                    onClick={() => setView(view === 'years' ? 'days' : 'years')}
                    className={cn(HEADER_BUTTON, view === 'years' && 'bg-ca-silver')}
                  >
                    {viewYear}
                    <FaChevronDown className={cn('text-[10px] text-ca-text transition-transform', view === 'years' && 'rotate-180')} />
                  </button>
                </div>
                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    aria-label='Oldingi oy'
                    disabled={!canGoPrev}
                    onClick={() => shiftMonth(-1)}
                    className={NAV_BUTTON}
                  >
                    <FaChevronLeft className='text-[10px]' />
                  </button>
                  <button
                    type='button'
                    aria-label='Keyingi oy'
                    disabled={!canGoNext}
                    onClick={() => shiftMonth(1)}
                    className={NAV_BUTTON}
                  >
                    <FaChevronRight className='text-[10px]' />
                  </button>
                </div>
              </div>

              <div className='h-64'>
                {view === 'days' && (
                  <DayPicker
                    mode='single'
                    selected={selected}
                    month={viewMonth}
                    onMonthChange={setViewMonth}
                    hideNavigation
                    captionLayout='label'
                    startMonth={CALENDAR_START_MONTH}
                    endMonth={CALENDAR_END_MONTH}
                    onSelect={(date) => {
                      if (date) pickDate(date)
                    }}
                    showOutsideDays
                    formatters={{
                      formatWeekdayName: (date) => date.toLocaleDateString('en-US', { weekday: 'narrow' }),
                    }}
                    classNames={{
                      root: 'text-ca-heading',
                      months: '',
                      month: '',
                      month_caption: 'hidden',
                      month_grid: 'w-full border-collapse',
                      weekdays: '',
                      weekday: 'w-8 pb-1 text-center text-[11px] font-medium text-ca-text',
                      week: '',
                      day: 'p-0 text-center',
                      day_button: 'flex h-8 w-8 items-center justify-center rounded-full text-xs text-ca-heading hover:bg-ca-silver',
                      selected: '[&>button]:bg-ca-theme [&>button]:text-white [&>button]:hover:bg-ca-theme-dark',
                      today: '[&>button]:border [&>button]:border-ca-theme',
                      outside: '[&>button]:text-ca-text/50',
                      disabled: '[&>button]:opacity-30 [&>button]:pointer-events-none',
                      hidden: 'invisible',
                    }}
                  />
                )}

                {view === 'months' && (
                  <div className='grid h-full grid-cols-3 content-start gap-1'>
                    {MONTH_NAMES.map((name, index) => {
                      const isSelected = index === viewMonthIndex
                      return (
                        <button
                          key={name}
                          type='button'
                          onClick={() => selectMonth(index)}
                          className={cn(
                            'flex h-9 items-center justify-center rounded-[3px] text-xs transition-colors',
                            isSelected ? 'bg-ca-theme font-semibold text-white' : 'text-ca-heading hover:bg-ca-silver',
                          )}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                )}

                {view === 'years' && (
                  <ScrollList className='grid h-full grid-cols-4 content-start gap-1'>
                    {YEARS.map((year) => {
                      const isSelected = year === viewYear
                      return (
                        <button
                          key={year}
                          type='button'
                          data-selected={isSelected}
                          onClick={() => selectYear(year)}
                          className={cn(
                            'flex h-8 items-center justify-center rounded-[3px] text-xs transition-colors',
                            isSelected ? 'bg-ca-theme font-semibold text-white' : 'text-ca-heading hover:bg-ca-silver',
                          )}
                        >
                          {year}
                        </button>
                      )
                    })}
                  </ScrollList>
                )}
              </div>
            </div>

            {showTime && (
              <div className='ml-3 flex gap-1 border-l border-ca-border pl-3'>
                <TimeColumn values={HOURS_12} selected={twelve.hour} onSelect={pickHour} />
                <TimeColumn values={MINUTE_STEPS} selected={current.minutes} onSelect={pickMinute} />
                <TimeColumn values={PERIODS} selected={twelve.period} onSelect={(period) => pickPeriod(period as Period)} />
              </div>
            )}
          </div>

          {showTime ? (
            <div className='mt-2 flex justify-end border-t border-ca-border pt-2'>
              <Button type='button' variant='ghost' size='xs' className='px-3 font-semibold text-ca-theme' onClick={() => setOpen(false)}>
                OK
              </Button>
            </div>
          ) : (
            <div className='mt-2 flex items-center gap-1 border-t border-ca-border pt-2'>
              <Button type='button' variant='ghost' size='xs' onClick={pickToday}>
                Bugun
              </Button>
              <Button type='button' variant='ghost' size='xs' onClick={clear}>
                Tozalash
              </Button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
