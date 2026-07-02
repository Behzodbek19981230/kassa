import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  children,
  align = 'end',
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  // Registers this portaled content with Radix's dismissable-layer surface
  // registry so an ancestor Dialog/Modal doesn't treat clicks inside it as
  // "outside" clicks and close itself (react-dropdown-menu doesn't register
  // this itself, unlike react-dialog's own overlay).
  const registerSurface = useDismissableLayerSurface()

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={registerSurface}
        align={align}
        sideOffset={0}
        className={cn(
          'z-50 min-w-[160px] overflow-hidden bg-white p-0 text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          className,
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'cursor-pointer px-[15px] py-[5px] text-ca-heading outline-none',
        'data-[highlighted]:bg-[#edf0f5]',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-ca-border', className)} />
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('bg-[#fafafa] px-5 py-2.5 text-xs font-normal text-ca-heading', className)}>
      {children}
    </div>
  )
}

export function DropdownMenuFooter({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('px-5 py-2.5 text-center', className)}>
      {children}
    </div>
  )
}

interface MediaMenuItemProps {
  icon?: ReactNode
  iconBg?: string
  image?: string
  title: string
  description?: string
  time?: string
  onSelect?: () => void
}

export function DropdownMediaItem({
  icon,
  iconBg = 'bg-ca-primary',
  image,
  title,
  description,
  time,
  onSelect,
}: MediaMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className="cursor-pointer border-b border-ca-border outline-none data-[highlighted]:bg-[#edf0f5]"
      onSelect={onSelect}
    >
      <div className="flex px-5 py-2.5">
        {image ? (
          <img src={image} alt="" className="mr-2.5 h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <div
            className={cn(
              'mr-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-white',
              iconBg,
            )}
          >
            {icon}
          </div>
        )}
        <div>
          <h6 className="m-0 font-semibold text-ca-heading">{title}</h6>
          {description && <p className="m-0 mb-1 text-xs text-ca-text">{description}</p>}
          {time && <div className="text-[11px] text-ca-text">{time}</div>}
        </div>
      </div>
    </DropdownMenuPrimitive.Item>
  )
}

export const DropdownMenuLinkItem = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      'block px-[15px] py-[5px] text-ca-heading no-underline hover:bg-[#edf0f5]',
      className,
    )}
    {...props}
  />
))
DropdownMenuLinkItem.displayName = 'DropdownMenuLinkItem'
