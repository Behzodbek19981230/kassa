import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'h-[34px] w-full rounded-[3px] border border-[#ccd0d4] bg-white px-3 text-xs text-ca-heading shadow-none transition-colors',
        'placeholder:text-ca-text focus:border-[#9fa2a5] focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
