import { DatePicker } from '@/components/ui/DatePicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

export interface DateTimePickerProps {
  /** Local date-time as `YYYY-MM-DDTHH:mm`, the same shape as `<input type="datetime-local">`. */
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function todayISODate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function DateTimePicker({ value, onChange, disabled, className }: DateTimePickerProps) {
  const [datePart = '', timePart = ''] = (value ?? '').split('T')
  const [hours = '00', minutes = '00'] = timePart.split(':')

  const emit = (date: string, hh: string, mm: string) => {
    if (!date) {
      onChange?.('')
      return
    }
    onChange?.(`${date}T${hh}:${mm}`)
  }

  // Picking a time before a date uses today, so the chosen time is kept.
  const handleHoursChange = (hh: string) => emit(datePart || todayISODate(), hh, minutes)
  const handleMinutesChange = (mm: string) => emit(datePart || todayISODate(), hours, mm)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className='min-w-0 flex-1'>
        <DatePicker value={datePart} onChange={(date) => emit(date, hours, minutes)} disabled={disabled} />
      </div>
      <Select value={hours} onValueChange={handleHoursChange} disabled={disabled}>
        <SelectTrigger className='w-[64px] shrink-0'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((hh) => (
            <SelectItem key={hh} value={hh}>
              {hh}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className='text-xs font-semibold text-ca-heading'>:</span>
      <Select value={minutes} onValueChange={handleMinutesChange} disabled={disabled}>
        <SelectTrigger className='w-[64px] shrink-0'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((mm) => (
            <SelectItem key={mm} value={mm}>
              {mm}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
