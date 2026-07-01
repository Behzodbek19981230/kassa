import type { HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { FaInfoCircle, FaTimes } from 'react-icons/fa'
import { cn } from '../../lib/utils'

const alertVariants = cva('relative rounded-[3px] px-[15px] py-3 text-xs', {
  variants: {
    variant: {
      success: 'bg-[#7cdda7] text-[#3c763d]',
      info: 'bg-[#93cfe5] text-[#31708f]',
      warning: 'bg-[#ffead0] text-[#8a6d3b]',
      danger: 'bg-[#f8b2b2] text-[#a94442]',
    },
  },
  defaultVariants: { variant: 'info' },
})

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

export function Alert({
  className,
  variant,
  dismissible,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      {children}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-3 text-lg leading-none opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss alert"
        >
          <FaTimes className="text-sm" />
        </button>
      )}
    </div>
  )
}

interface AlertBlockProps extends AlertProps {
  title: string
  icon?: ReactNode
}

export function AlertBlock({ title, icon, children, className, variant, ...props }: AlertBlockProps) {
  return (
    <Alert variant={variant} className={cn('mb-0', className)} {...props}>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon ?? <FaInfoCircle />}
        {title}
      </h4>
      {children && <p className="m-0">{children}</p>}
    </Alert>
  )
}

const noteVariants = cva('mb-5 border-l-[3px] p-[15px] text-xs', {
  variants: {
    variant: {
      success: 'border-[#4a8564] bg-[#b0ebca] text-[#3c763d]',
      info: 'border-[#587c89] bg-[#bee2ef] text-[#31708f]',
      warning: 'border-[#9d9080] bg-[#fff2e3] text-[#8a6d3b]',
      danger: 'border-[#986e6e] bg-[#fbd1d1] text-[#a94442]',
    },
  },
  defaultVariants: { variant: 'info' },
})

export function Note({ className, variant, ...props }: AlertProps) {
  return <div className={cn(noteVariants({ variant }), className)} {...props} />
}

interface ProgressProps {
  value: number
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const barColors = {
  default: 'bg-ca-primary',
  success: 'bg-ca-green',
  warning: 'bg-ca-orange',
  danger: 'bg-ca-red',
  info: 'bg-ca-aqua',
}

const sizes = { xs: 'h-[5px]', sm: 'h-[10px]', md: 'h-4', lg: 'h-[30px]' }

export function Progress({ value, variant = 'default', className, size = 'sm' }: ProgressProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-[3px] bg-[#e2e7eb]', sizes[size], className)}>
      <div
        className={cn('h-full rounded-[3px] transition-all', barColors[variant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
