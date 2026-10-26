import {
  Children,
  Fragment,
  isValidElement,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import ReactSelect, { components, type GroupBase, type SelectInstance } from 'react-select'
import { FaChevronDown } from 'react-icons/fa'
import { useInsideModal } from '@/components/ui/Modal'
import {
  baseClassNames,
  MENU_CLASS,
  MENU_MAX_HEIGHT,
  scrollControlIntoView,
} from '@/components/ui/SearchableSelect'
import { useCloseOnModalOpen, useIsTablet, useKeyboardInset } from '@/lib/useDropdownPlacement'
import { cn } from '@/lib/utils'

/*
 * Plain (non-searchable) dropdown built on react-select. It keeps the compositional API the pages
 * already use — <Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/>…
 * — by reading those elements as configuration and rendering a single react-select.
 */

interface SelectItemProps {
  value: string
  disabled?: boolean
  className?: string
  children?: ReactNode
}

interface SelectTriggerProps {
  className?: string
  children?: ReactNode
  id?: string
}

interface SelectValueProps {
  placeholder?: ReactNode
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children?: ReactNode
}

// Marker components: <Select> reads their props; they render nothing on their own.
const SelectGroup = ({ children }: { children?: ReactNode }) => <>{children}</>
const SelectValue = (_props: SelectValueProps) => null
const SelectTrigger = (_props: SelectTriggerProps) => null
const SelectContent = (_props: ComponentPropsWithoutRef<'div'> & { position?: string }) => null
const SelectItem = (_props: SelectItemProps) => null

interface ItemOption {
  value: string
  label: ReactNode
  text: string
  isDisabled?: boolean
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function walk(node: ReactNode, visit: (el: ReactElement<Record<string, unknown>>) => boolean | void) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return
    const el = child as ReactElement<Record<string, unknown>>
    if (visit(el) === false) return
    if (el.type === Fragment || el.type === SelectGroup || el.type === SelectContent) {
      walk(el.props.children as ReactNode, visit)
    }
  })
}

function readConfig(children: ReactNode) {
  let triggerClassName: string | undefined
  let placeholder: ReactNode
  const options: ItemOption[] = []

  walk(children, (el) => {
    if (el.type === SelectTrigger) {
      triggerClassName = el.props.className as string | undefined
      walk(el.props.children as ReactNode, (inner) => {
        if (inner.type === SelectValue) placeholder = inner.props.placeholder as ReactNode
      })
      return false
    }
    if (el.type === SelectItem) {
      const label = el.props.children as ReactNode
      options.push({
        value: String(el.props.value),
        label,
        text: textOf(label),
        isDisabled: Boolean(el.props.disabled),
      })
      return false
    }
  })

  return { triggerClassName, placeholder, options }
}

/** Height utilities on the trigger size the control itself; the rest (width…) sizes the wrapper. */
function splitTriggerClasses(className?: string) {
  const tokens = (className ?? '').split(/\s+/).filter(Boolean)
  const isHeight = (t: string) => /^(lg:)?(min-)?h-/.test(t)
  return {
    wrapper: tokens.filter((t) => !isHeight(t)).join(' '),
    control: tokens.filter(isHeight).join(' '),
  }
}

type RSInstance = SelectInstance<ItemOption, false, GroupBase<ItemOption>>

function Select({ value, defaultValue, onValueChange, onOpenChange, disabled, children }: SelectProps) {
  const { triggerClassName, placeholder, options } = readConfig(children)
  const insideModal = useInsideModal()
  const isTablet = useIsTablet()
  const keyboardInset = useKeyboardInset()
  const ref = useRef<RSInstance>(null)
  useCloseOnModalOpen(() => ref.current?.blur())

  const current = value ?? defaultValue ?? ''
  const selected = options.find((o) => o.value === current) ?? null
  const { wrapper, control } = splitTriggerClasses(triggerClassName)

  const maxMenuHeight =
    keyboardInset > 0
      ? Math.max(120, Math.min(MENU_MAX_HEIGHT, window.innerHeight - keyboardInset - 150))
      : MENU_MAX_HEIGHT

  return (
    <ReactSelect<ItemOption, false>
      ref={ref}
      unstyled
      isSearchable={false}
      isDisabled={disabled}
      options={options}
      value={selected}
      onChange={(next) => {
        if (next) onValueChange?.(next.value)
      }}
      getOptionLabel={(o) => o.text}
      getOptionValue={(o) => o.value}
      formatOptionLabel={(o) => o.label}
      placeholder={placeholder ?? 'Tanlang...'}
      onMenuOpen={() => {
        onOpenChange?.(true)
        if (isTablet) window.setTimeout(() => scrollControlIntoView(ref.current?.controlRef), 50)
      }}
      onMenuClose={() => onOpenChange?.(false)}
      classNames={{
        ...(baseClassNames as object),
        // Merged (not a separate className) so a width from the trigger overrides the base `w-full`.
        container: () => cn('w-full', wrapper),
        control: ({ isFocused, isDisabled }) =>
          cn(
            'min-h-0! w-full rounded-[3px] border bg-ca-silver-light px-3 text-base lg:text-xs',
            control ? '' : 'h-10 lg:h-[34px]',
            isFocused ? 'border-ca-field-border-strong' : 'border-ca-field-border',
            isDisabled && 'cursor-not-allowed bg-ca-muted-2 opacity-60',
            control,
          ),
        menu: () => MENU_CLASS,
        option: ({ isFocused, isSelected, isDisabled }) =>
          cn(
            'cursor-pointer rounded-[2px] py-1.5 pr-7 pl-2.5 text-ca-heading select-none',
            (isFocused || isSelected) && 'bg-ca-muted',
            isDisabled && 'pointer-events-none opacity-50',
          ),
      }}
      menuPlacement={isTablet ? 'bottom' : 'auto'}
      menuShouldScrollIntoView={!isTablet}
      maxMenuHeight={maxMenuHeight}
      // Inside a modal the menu stays in place (a body portal would sit outside the dialog's pointer/focus scope).
      menuPortalTarget={insideModal ? undefined : document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1040 }) }}
      components={{
        IndicatorSeparator: null,
        DropdownIndicator: (props) => (
          <components.DropdownIndicator {...props}>
            <FaChevronDown className='text-[10px]' />
          </components.DropdownIndicator>
        ),
      }}
    />
  )
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
