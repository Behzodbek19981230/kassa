import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[3px] text-xs font-normal transition-all duration-100 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-[#b6c2c9] text-white hover:bg-[#929ba1]',
        primary: 'bg-ca-primary text-white hover:bg-[#2a72b5]',
        success: 'bg-ca-green text-white hover:bg-ca-theme-dark',
        warning: 'bg-ca-orange text-white hover:bg-[#c47d15]',
        danger: 'bg-ca-red text-white hover:bg-[#cc4946]',
        white: 'border border-ca-border bg-white text-[#333] hover:bg-ca-border',
        inverse: 'bg-ca-panel-inverse text-white hover:bg-[#242a30]',
        theme: 'bg-ca-theme text-white hover:bg-ca-theme-dark',
        info: 'bg-ca-aqua text-white hover:bg-[#3a92ab]',
        link: 'bg-transparent text-ca-heading underline-offset-2 hover:underline',
        ghost: 'bg-transparent text-ca-text hover:bg-ca-silver',
      },
      size: {
        sm: 'h-[30px] px-3 py-1.5',
        xs: 'h-[22px] px-2 py-1 text-[10px]',
        md: 'h-[34px] px-3 py-2',
        lg: 'h-[40px] px-4 py-2.5 text-sm',
        icon: 'h-7 w-7 p-0',
        'icon-xs': 'h-[18px] w-[18px] rounded-full p-0 text-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export const buttonProps = (
  children?: ButtonProps['children'],
  variant?: ButtonProps['variant'],
  size?: ButtonProps['size'],
): ButtonProps => ({ children, variant, size })

export { Button, buttonVariants }
