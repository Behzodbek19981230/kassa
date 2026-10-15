import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
  horizontal?: boolean
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
  labelClassName,
  horizontal = true,
}: FormFieldProps) {
  if (!horizontal) {
    return (
      <div className={cn('mb-4', className)}>
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-ca-heading">
          {label}
          {required && <span className="text-ca-red"> *</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-[11px] text-ca-red">{error}</p>}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mb-0 flex flex-wrap border-b border-ca-border py-4 last:border-b-0',
        error && 'bg-[#ffdedd]/30',
        className,
      )}
    >
      <label
        htmlFor={htmlFor}
        className={cn(
          'w-full px-4 py-1 text-xs font-semibold text-ca-heading sm:w-1/3',
          labelClassName,
        )}
      >
        {label}
        {required && <span className="text-ca-red"> *</span>}
      </label>
      <div className="w-full px-4 sm:w-2/3">
        {children}
        {error && <p className="mt-1 text-[11px] text-ca-red">{error}</p>}
      </div>
    </div>
  )
}

interface FormGroupProps {
  children: ReactNode
  className?: string
  bordered?: boolean
}

export function FormGroup({ children, className, bordered = false }: FormGroupProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-start',
        bordered && 'border-b border-ca-border pb-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function FormLabel({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-0 w-full px-0 py-1 text-xs font-semibold text-ca-heading sm:w-1/4', className)}
    >
      {children}
    </label>
  )
}

export function FormControl({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('w-full sm:w-3/4', className)}>{children}</div>
}
