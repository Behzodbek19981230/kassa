import { forwardRef, useEffect, useState, type ChangeEvent, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/Input'

export interface PriceInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Plain numeric string (e.g. `"12345.5"`), no thousand separators. */
  value?: string | number | null
  /** Called with the plain numeric string (separators stripped). */
  onChange?: (value: string) => void
}

function formatPrice(raw: string): string {
  const [intPartRaw, decPartRaw] = raw.split('.')
  const intPart = intPartRaw.replace(/^0+(?=\d)/, '')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (decPartRaw === undefined) return grouped
  return `${grouped}.${decPartRaw.slice(0, 2)}`
}

function unformatPrice(display: string): string {
  const cleaned = display.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
}

/** Number input with a live thousand-separator mask, for money fields (narxi/summa/price/...). */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const rawValue = value === undefined || value === null ? '' : String(value)
    const [display, setDisplay] = useState(() => formatPrice(rawValue))

    useEffect(() => {
      setDisplay((prev) => (unformatPrice(prev) === rawValue ? prev : formatPrice(rawValue)))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawValue])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = unformatPrice(e.target.value)
      setDisplay(formatPrice(raw))
      onChange?.(raw)
    }

    return (
      <Input
        ref={ref}
        inputMode='decimal'
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
