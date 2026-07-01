import * as Dialog from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react'
import { FaTimes } from 'react-icons/fa'
import { cn } from '@/lib/utils'

export const Modal = Dialog.Root
export const ModalTrigger = Dialog.Trigger
export const ModalClose = Dialog.Close
export const ModalPortal = Dialog.Portal

const overlayVariants = cva('fixed inset-0 z-[1050] bg-black/50', {
  variants: {
    animated: {
      true: 'data-[state=open]:animate-[fadeIn_0.15s_ease-out] data-[state=closed]:animate-[fadeOut_0.15s_ease-in]',
      false: '',
    },
  },
  defaultVariants: { animated: true },
})

export const ModalOverlay = forwardRef<
  ElementRef<typeof Dialog.Overlay>,
  ComponentPropsWithoutRef<typeof Dialog.Overlay> & VariantProps<typeof overlayVariants>
>(({ className, animated = true, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(overlayVariants({ animated }), className)}
    {...props}
  />
))
ModalOverlay.displayName = Dialog.Overlay.displayName

const contentVariants = cva(
  'fixed left-1/2 top-1/2 z-[1060] w-[calc(100%-30px)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 bg-white shadow-[0_5px_15px_rgba(0,0,0,0.3)] focus:outline-none',
  {
    variants: {
      variant: {
        default: 'rounded-[3px]',
        message: 'max-w-none rounded-none',
        alert: 'rounded-[3px]',
      },
      animated: {
        true: 'data-[state=open]:animate-[modalIn_0.2s_ease-out] data-[state=closed]:animate-[modalOut_0.15s_ease-in]',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', animated: true },
  },
)

export interface ModalContentProps
  extends ComponentPropsWithoutRef<typeof Dialog.Content>,
    VariantProps<typeof contentVariants> {
  showClose?: boolean
}

export const ModalContent = forwardRef<ElementRef<typeof Dialog.Content>, ModalContentProps>(
  ({ className, children, variant = 'default', animated = true, showClose = true, ...props }, ref) => (
    <ModalPortal>
      <ModalOverlay animated={animated} />
      <Dialog.Content
        ref={ref}
        className={cn(contentVariants({ variant, animated }), className)}
        {...props}
      >
        {variant === 'message' ? (
          <div className="modal-inner mx-auto w-[60%]">{children}</div>
        ) : (
          children
        )}
        {showClose && (
          <Dialog.Close
            className="absolute top-3 right-[15px] text-xl leading-none text-[#707478] opacity-80 transition-opacity hover:opacity-100 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes className="text-sm" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </ModalPortal>
  ),
)
ModalContent.displayName = Dialog.Content.displayName

export function ModalHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-ca-border px-[15px] py-3 pr-10', className)}
      {...props}
    />
  )
}

export function ModalTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Dialog.Title
      className={cn('text-sm font-medium text-ca-heading', className)}
      {...props}
    />
  )
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-[15px] text-xs text-ca-text', className)} {...props} />
}

export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-ca-border px-[15px] py-[14px]', className)}
      {...props}
    />
  )
}
