import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[75%] font-semibold leading-none',
  {
    variants: {
      variant: {
        default: 'bg-[#b6c2c9] text-white',
        theme: 'bg-ca-theme text-white',
        primary: 'bg-ca-primary text-white',
        success: 'bg-ca-green text-white',
        warning: 'bg-ca-orange text-white',
        danger: 'bg-ca-red text-white',
        inverse: 'bg-ca-panel-inverse text-white',
        info: 'bg-ca-aqua text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

/** Color Admin `.label` — same styling as badge */
export function Label({ className, variant, ...props }: BadgeProps) {
  return <Badge className={className} variant={variant} {...props} />
}

export { badgeVariants }
