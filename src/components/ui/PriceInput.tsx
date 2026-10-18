import { forwardRef, useEffect, useState, type ChangeEvent, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/Input'

export interface PriceInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Plain numeric string (e.g. `"12345.5"`), no thousand separators. */
  value?: string | number | null
  /** Called with the plain numeric string (separators stripped). */
  onChange?: (value: string) => void
  /** Max digits after the decimal point. Defaults to 2 (money); exchange rates may need more. */
  decimals?: number
  /** Allows a leading minus sign (e.g. `"-1000"`). */
  allowNegative?: boolean
}

function formatPrice(raw: string, decimals: number): string {
  const [intPartRaw, decPartRaw] = raw.split('.')
  const intPart = intPartRaw.replace(/^0+(?=\d)/, '')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (decPartRaw === undefined) return grouped
  return `${grouped}.${decPartRaw.slice(0, decimals)}`
}

function unformatPrice(display: string, decimals: number, allowNegative = false): string {
  const sign = allowNegative && display.trim().startsWith('-') ? '-' : ''
  const cleaned = display.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return sign + cleaned
  const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, decimals)
  return `${sign}${cleaned.slice(0, firstDot)}.${decPart}`
}

/** Number input with a live thousand-separator mask, for money fields (narxi/summa/price/...). */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, className, decimals = 2, allowNegative = false, ...props }, ref) => {
    const rawValue = value === undefined || value === null ? '' : String(value)
    const [display, setDisplay] = useState(() => formatPrice(rawValue, decimals))

    useEffect(() => {
      setDisplay((prev) => (unformatPrice(prev, decimals, allowNegative) === rawValue ? prev : formatPrice(rawValue, decimals)))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawValue])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = unformatPrice(e.target.value, decimals, allowNegative)
      setDisplay(formatPrice(raw, decimals))
      onChange?.(raw)
    }

    return (
      <Input
        ref={ref}
        inputMode={allowNegative ? undefined : 'decimal'}
        autoComplete='off'
        value={display}
        onChange={handleChange}
        className={className}
        {...props}
      />
    )
  },
)
PriceInput.displayName = 'PriceInput'
