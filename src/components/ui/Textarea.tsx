import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'w-full rounded-[3px] border border-[#ccd0d4] bg-white px-3 py-2 text-xs text-ca-heading shadow-none',
        'placeholder:text-ca-text focus:border-[#9fa2a5] focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
