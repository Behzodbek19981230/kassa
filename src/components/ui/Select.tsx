import { useComposedRefs } from '@radix-ui/react-compose-refs'
import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as SelectPrimitive from '@radix-ui/react-select'
import { forwardRef } from 'react'
import { FaCheck, FaChevronDown } from 'react-icons/fa'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-[34px] w-full items-center justify-between gap-2 rounded-[3px] border border-[#ccd0d4] bg-white px-3 text-xs text-ca-heading',
      'focus:border-[#9fa2a5] focus:outline-none',
      'data-[placeholder]:text-ca-text',
      'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <FaChevronDown className="shrink-0 text-[10px] text-ca-text" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => {
  // Registers this portaled content with Radix's dismissable-layer surface
  // registry so an ancestor Dialog/Modal doesn't treat clicks inside it as
  // "outside" clicks and close itself (react-select doesn't register this
  // itself, unlike react-dialog's own overlay).
  const registerSurface = useDismissableLayerSurface()
  const composedRef = useComposedRefs(ref, registerSurface)

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={composedRef}
        position={position}
        sideOffset={4}
        className={cn(
          'z-[1070] min-w-[8rem] overflow-hidden rounded-[3px] border border-ca-border bg-white text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]',
          position === 'popper' &&
            'w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)]',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'w-full')}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center rounded-[2px] py-1.5 pr-7 pl-2.5 text-ca-heading outline-none select-none',
      'data-[highlighted]:bg-[#edf0f5]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <FaCheck className="text-[10px] text-ca-theme" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
