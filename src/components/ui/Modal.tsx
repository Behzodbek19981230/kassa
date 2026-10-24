import * as Dialog from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react'
import { FaTimes } from 'react-icons/fa'
import { closeAllDropdowns } from '@/lib/useDropdownPlacement'
import { cn } from '@/lib/utils'
import { HeaderSlotContext } from '@/components/ui/HeaderSlot'

// ModalHeader registers its slot element here so table controls inside the body can portal into it.
const RegisterHeaderSlotContext = createContext<((el: HTMLElement | null) => void) | null>(null)

const InsideModalContext = createContext(false)

/** True under a ModalContent (React context crosses portals, so dropdown popups see it too). */
export function useInsideModal() {
  return useContext(InsideModalContext)
}

/** Dropdown popups (select/combobox) sit above modals only when opened from inside one. */
export function useDropdownZIndexClass() {
  return useInsideModal() ? 'z-[1070]' : 'z-[1040]'
}

export const Modal = Dialog.Root
export const ModalTrigger = Dialog.Trigger
export const ModalClose = Dialog.Close
export const ModalPortal = Dialog.Portal

const overlayVariants = cva('fixed inset-x-0 top-0 bottom-[var(--kb-inset,0px)] z-[1050] flex overflow-y-auto overscroll-contain bg-black/50 p-[15px]', {
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
  'relative m-auto w-full max-w-[600px] bg-ca-silver-light shadow-[0_5px_15px_rgba(0,0,0,0.3)] focus:outline-none',
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
  ({ className, children, variant = 'default', animated = true, showClose = true, ...props }, ref) => {
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)
    useEffect(() => {
      closeAllDropdowns()
    }, [])
    return (
    <ModalPortal>
      {/* The content lives inside the overlay, so the whole overlay scrolls (e.g. when a tablet keyboard opens). */}
      <ModalOverlay animated={animated}>
        <Dialog.Content
          ref={ref}
          className={cn(contentVariants({ variant, animated }), className)}
          {...props}
        >
          <InsideModalContext.Provider value={true}>
          <HeaderSlotContext.Provider value={headerSlot}>
            <RegisterHeaderSlotContext.Provider value={setHeaderSlot}>
              {variant === 'message' ? (
                <div className="modal-inner mx-auto w-[60%]">{children}</div>
              ) : (
                children
              )}
            </RegisterHeaderSlotContext.Provider>
          </HeaderSlotContext.Provider>
          </InsideModalContext.Provider>
          {showClose && (
            <Dialog.Close
              className="absolute top-3 right-[15px] text-xl leading-none text-ca-text opacity-80 transition-opacity hover:opacity-100 focus:outline-none"
              aria-label="Close"
            >
              <FaTimes className="text-sm" />
            </Dialog.Close>
          )}
        </Dialog.Content>
      </ModalOverlay>
    </ModalPortal>
    )
  },
)
ModalContent.displayName = Dialog.Content.displayName

export function ModalHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const registerSlot = useContext(RegisterHeaderSlotContext)
  return (
    <div className={cn('border-b border-ca-border px-[15px] py-3 pr-10', className)} {...props}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <div ref={registerSlot} className="flex items-center gap-2 empty:hidden" />
      </div>
    </div>
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
      className={cn('flex flex-wrap items-center justify-end gap-2 [&>:first-child:not(:only-child)]:mr-auto border-t border-ca-border px-[15px] py-[14px]', className)}
      {...props}
    />
  )
}
