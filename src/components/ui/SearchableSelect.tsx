import { useEffect, useMemo, useRef, useState } from 'react'
import ReactSelect, { components, type ClassNamesConfig, type GroupBase, type SelectInstance } from 'react-select'
import { FaChevronDown, FaTimes } from 'react-icons/fa'
import { useInsideModal } from '@/components/ui/Modal'
import { useCloseOnModalOpen, useIsTablet, useKeyboardInset } from '@/lib/useDropdownPlacement'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectLoadResult {
  options: SelectOption[]
  hasMore: boolean
}

export interface SelectLoadParams {
  search: string
  page: number
}

export interface SearchableSelectProps {
  value: string[]
  multi?: boolean
  onValuesChange: (values: string[], options: SelectOption[]) => void
  options?: SelectOption[]
  loadOptions?: (params: SelectLoadParams) => Promise<SelectLoadResult>
  /** Labels for values this instance didn't produce (prefilled edit forms). */
  labels?: Record<string, string>
  placeholder?: string
  emptyText?: string
  loadingText?: string
  disabled?: boolean
  debounceMs?: number
  className?: string
  menuClassName?: string
  wrapOptions?: boolean
  clearable?: boolean
}

/** Scrolls the field to the top of the visible area, leaving room for the fixed header and the field's label above it. */
export function scrollControlIntoView(el: HTMLElement | null | undefined) {
  if (!el) return
  el.style.scrollMarginTop = '110px'
  el.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

/** Height / text-size utilities size the control itself; the rest (width, margin…) sizes the wrapper. */
export function splitFieldClasses(className?: string) {
  const tokens = (className ?? '').split(/\s+/).filter(Boolean)
  const forControl = (t: string) => /^(lg:)?(min-|max-)?h-/.test(t) || /^(lg:)?text-(\[|xs|sm|base|lg|xl)/.test(t)
  const control = tokens.filter(forControl)
  return {
    wrapper: tokens.filter((t) => !forControl(t)).join(' '),
    control: control.join(' '),
    hasHeight: control.some((t) => /^(lg:)?h-/.test(t)),
  }
}

type Option = SelectOption
type Group = GroupBase<Option>

export const MENU_MAX_HEIGHT = 240

export const baseClassNames: ClassNamesConfig<Option, boolean, Group> = {
  container: () => 'w-full',
  control: ({ isFocused, isDisabled }) =>
    cn(
      'min-h-10! w-full rounded-[3px] border bg-ca-silver-light px-3 text-base lg:min-h-[34px]! lg:text-xs',
      isFocused ? 'border-ca-field-border-strong' : 'border-ca-field-border',
      isDisabled && 'cursor-not-allowed bg-ca-muted-2 opacity-60',
    ),
  valueContainer: () => 'gap-1 py-0.5',
  singleValue: () => 'truncate text-ca-heading',
  placeholder: () => 'text-ca-text',
  input: () => 'text-ca-heading',
  multiValue: () => 'flex items-center gap-1 rounded-[2px] bg-ca-muted px-1.5 py-0.5 text-ca-heading',
  multiValueRemove: () => 'cursor-pointer text-ca-text hover:text-ca-heading',
  indicatorsContainer: () => 'gap-1 text-ca-text',
  noOptionsMessage: () => 'px-2.5 py-3 text-center text-ca-text',
  loadingMessage: () => 'px-2.5 py-3 text-center text-ca-text',
  menuList: () => 'p-1',
}

export const MENU_CLASS =
  'mt-1 overflow-hidden rounded-[3px] border border-ca-border bg-ca-silver-light text-base shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)] lg:text-xs'

/**
 * react-select based searchable dropdown shared by Combobox / MultiCombobox. Handles static or
 * paginated API options, and keeps the menu usable above a tablet's on-screen keyboard.
 */
export function SearchableSelect({
  value,
  multi = false,
  onValuesChange,
  options: staticOptions,
  loadOptions,
  labels,
  placeholder = 'Tanlang...',
  emptyText = 'Hech narsa topilmadi',
  loadingText = 'Yuklanmoqda...',
  disabled = false,
  debounceMs = 300,
  className,
  menuClassName,
  wrapOptions = false,
  clearable = false,
}: SearchableSelectProps) {
  const isAsync = typeof loadOptions === 'function'
  const fieldClasses = splitFieldClasses(className)
  const insideModal = useInsideModal()
  const isTablet = useIsTablet()
  const keyboardInset = useKeyboardInset()

  const selectRef = useRef<SelectInstance<Option, boolean, Group>>(null)
  const requestId = useRef(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Option[]>(staticOptions ?? [])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [knownLabels, setKnownLabels] = useState<Record<string, string>>({})

  useCloseOnModalOpen(() => selectRef.current?.blur())

  useEffect(() => {
    if (!isAsync) setItems(staticOptions ?? [])
  }, [isAsync, staticOptions])

  useEffect(() => {
    if (items.length === 0) return
    setKnownLabels((prev) => {
      const next = { ...prev }
      for (const item of items) next[item.value] = item.label
      return next
    })
  }, [items])

  const fetchOptions = async (searchTerm: string, pageNum: number, append: boolean) => {
    if (!loadOptions) return
    const thisRequest = ++requestId.current
    setLoading(true)
    try {
      const result = await loadOptions({ search: searchTerm, page: pageNum })
      if (thisRequest !== requestId.current) return
      setItems((prev) => (append ? [...prev, ...result.options] : result.options))
      setHasMore(result.hasMore)
      setPage(pageNum)
    } finally {
      if (thisRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAsync || !menuOpen) return
    const timer = setTimeout(() => fetchOptions(search, 1, false), search ? debounceMs : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, menuOpen, isAsync])

  const selectedOptions: Option[] = useMemo(
    () =>
      value.map((v) => ({
        value: v,
        label: labels?.[v] ?? knownLabels[v] ?? staticOptions?.find((o) => o.value === v)?.label ?? '',
      })),
    [value, labels, knownLabels, staticOptions],
  )

  const handleMenuOpen = () => {
    setMenuOpen(true)
    // On a tablet the on-screen keyboard covers the lower half: bring the field to the top of the
    // visible area so the menu opens below it.
    if (isTablet) {
      window.setTimeout(() => {
        scrollControlIntoView(selectRef.current?.controlRef)
      }, 50)
    }
  }

  const maxMenuHeight =
    keyboardInset > 0
      ? Math.max(120, Math.min(MENU_MAX_HEIGHT, window.innerHeight - keyboardInset - 150))
      : MENU_MAX_HEIGHT

  return (
    <ReactSelect<Option, boolean>
      ref={selectRef}
      unstyled
      isMulti={multi}
      isDisabled={disabled}
      isClearable={clearable || multi}
      isLoading={loading}
      options={items}
      value={multi ? selectedOptions : selectedOptions[0] ?? null}
      inputValue={search}
      onInputChange={(text, meta) => {
        if (meta.action === 'input-change') setSearch(text)
        else if (meta.action === 'menu-close' || meta.action === 'set-value' || meta.action === 'input-blur') setSearch('')
      }}
      // API options are already filtered server-side
      filterOption={isAsync ? null : undefined}
      onChange={(next) => {
        const list: Option[] = next == null ? [] : Array.isArray(next) ? [...next] : [next as Option]
        onValuesChange(
          list.map((o) => o.value),
          list,
        )
      }}
      onMenuOpen={handleMenuOpen}
      onMenuClose={() => setMenuOpen(false)}
      onMenuScrollToBottom={() => {
        if (isAsync && hasMore && !loading) fetchOptions(search, page + 1, true)
      }}
      closeMenuOnSelect={!multi}
      hideSelectedOptions={false}
      placeholder={placeholder}
      noOptionsMessage={() => emptyText}
      loadingMessage={() => loadingText}
      className={fieldClasses.wrapper}
      classNames={{
        ...baseClassNames,
        control: ({ isFocused, isDisabled }) =>
          cn(
            'w-full rounded-[3px] border bg-ca-silver-light px-3 text-base lg:text-xs',
            fieldClasses.hasHeight ? 'min-h-0! px-2' : 'min-h-10! lg:min-h-[34px]!',
            isFocused ? 'border-ca-field-border-strong' : 'border-ca-field-border',
            isDisabled && 'cursor-not-allowed bg-ca-muted-2 opacity-60',
            fieldClasses.control,
          ),
        menu: () => cn(MENU_CLASS, menuClassName),
        option: ({ isFocused, isSelected }) =>
          cn(
            'cursor-pointer rounded-[2px] px-2.5 py-1.5 text-ca-heading select-none',
            (isFocused || isSelected) && 'bg-ca-muted',
            wrapOptions ? 'break-words whitespace-normal' : 'truncate',
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
        ClearIndicator: (props) => (
          <components.ClearIndicator {...props}>
            <FaTimes className='text-[10px] hover:text-ca-heading' />
          </components.ClearIndicator>
        ),
      }}
    />
  )
}
