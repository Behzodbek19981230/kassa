import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { FaCheck } from 'react-icons/fa'
import { cn } from '../../lib/utils'

interface CheckboxProps {
  id?: string
  label?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  inline?: boolean
  className?: string
}

export function Checkbox({
  id,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  inline = false,
  className,
}: CheckboxProps) {
  const content = (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-2 text-xs font-normal text-ca-heading',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border border-[#ccd0d4] bg-white',
          'data-[state=checked]:border-ca-green data-[state=checked]:bg-ca-green',
        )}
      >
        <CheckboxPrimitive.Indicator>
          <FaCheck className="text-[8px] text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <span>{label}</span>}
    </label>
  )

  if (inline) return content
  return <div className="mb-2">{content}</div>
}
