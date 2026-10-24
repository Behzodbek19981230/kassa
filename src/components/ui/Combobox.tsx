import { SearchableSelect } from '@/components/ui/SearchableSelect'

export interface ComboboxOption {
	value: string
	label: string
}

export interface ComboboxLoadResult {
	options: ComboboxOption[]
	hasMore: boolean
}

export interface ComboboxLoadParams {
	search: string
	page: number
}

export interface ComboboxProps {
	value?: string
	onChange?: (value: string, option: ComboboxOption | null) => void
	/** Static list of options. Filtered client-side as the user types. */
	options?: ComboboxOption[]
	/**
	 * Loads options from an API. Called on open and again (debounced) whenever the
	 * search text changes, and once more per page when the list is scrolled to the bottom.
	 */
	loadOptions?: (params: ComboboxLoadParams) => Promise<ComboboxLoadResult>
	/** Label for `value` when it wasn't produced by this instance (e.g. prefilled edit form). */
	selectedLabel?: string
	placeholder?: string
	searchPlaceholder?: string
	emptyText?: string
	loadingText?: string
	disabled?: boolean
	debounceMs?: number
	className?: string
	contentClassName?: string
	/** Wraps long option labels onto multiple lines instead of truncating them. */
	wrapOptions?: boolean
	/** Shows an "x" button to clear the current value when one is selected. */
	clearable?: boolean
}

/** Searchable single select, built on react-select (see SearchableSelect). */
export function Combobox({
	value = '',
	onChange,
	options,
	loadOptions,
	selectedLabel,
	placeholder = 'Tanlang...',
	emptyText,
	loadingText,
	disabled,
	debounceMs,
	className,
	contentClassName,
	wrapOptions,
	clearable,
}: ComboboxProps) {
	return (
		<SearchableSelect
			value={value ? [value] : []}
			onValuesChange={(values, selected) => onChange?.(values[0] ?? '', selected[0] ?? null)}
			options={options}
			loadOptions={loadOptions}
			labels={value && selectedLabel ? { [value]: selectedLabel } : undefined}
			placeholder={placeholder}
			emptyText={emptyText}
			loadingText={loadingText}
			disabled={disabled}
			debounceMs={debounceMs}
			className={className}
			menuClassName={contentClassName}
			wrapOptions={wrapOptions}
			clearable={clearable}
		/>
	)
}
