import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'h-[34px] w-full rounded-[3px] border border-ca-field-border bg-ca-silver-light px-3 text-xs text-ca-heading shadow-none transition-colors',
        'placeholder:text-ca-text focus:border-ca-field-border-strong focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-ca-muted-2 disabled:opacity-60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
