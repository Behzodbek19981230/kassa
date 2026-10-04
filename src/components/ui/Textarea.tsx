import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'w-full rounded-[3px] border border-ca-field-border bg-ca-silver-light px-3 py-2 text-xs text-ca-heading shadow-none',
        'placeholder:text-ca-text focus:border-ca-field-border-strong focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-ca-muted-2 disabled:opacity-60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
