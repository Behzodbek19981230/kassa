import { cn } from '../../lib/utils'

interface RadioGroupProps {
  name: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: { value: string; label: string }[]
  inline?: boolean
  className?: string
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onChange,
  options,
  inline = false,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn(inline ? 'flex flex-wrap gap-4' : 'space-y-2', className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2 text-xs font-normal text-ca-heading"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value !== undefined ? value === opt.value : undefined}
            defaultChecked={defaultValue === opt.value}
            onChange={() => onChange?.(opt.value)}
            className="accent-ca-green"
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}
