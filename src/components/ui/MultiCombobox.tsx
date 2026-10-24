import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { ComboboxLoadParams, ComboboxLoadResult, ComboboxOption } from '@/components/ui/Combobox'

export interface MultiComboboxProps {
  value?: string[]
  onChange?: (values: string[]) => void
  /** Static list of options. Filtered client-side as the user types. */
  options?: ComboboxOption[]
  /** Loads options from an API, same contract as Combobox's loadOptions. */
  loadOptions?: (params: ComboboxLoadParams) => Promise<ComboboxLoadResult>
  /** Labels for values that weren't produced by this instance (e.g. prefilled edit form). */
  selectedLabels?: Record<string, string>
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loadingText?: string
  disabled?: boolean
  debounceMs?: number
  className?: string
  contentClassName?: string
}

/** Searchable multi select, built on react-select (see SearchableSelect). */
export function MultiCombobox({
  value = [],
  onChange,
  options,
  loadOptions,
  selectedLabels,
  placeholder = 'Tanlang...',
  emptyText,
  loadingText,
  disabled,
  debounceMs,
  className,
  contentClassName,
}: MultiComboboxProps) {
  return (
    <SearchableSelect
      multi
      value={value}
      onValuesChange={(values) => onChange?.(values)}
      options={options}
      loadOptions={loadOptions}
      labels={selectedLabels}
      placeholder={placeholder}
      emptyText={emptyText}
      loadingText={loadingText}
      disabled={disabled}
      debounceMs={debounceMs}
      className={className}
      menuClassName={contentClassName}
    />
  )
}
