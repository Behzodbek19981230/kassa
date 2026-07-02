import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaCheck, FaChevronDown, FaSearch, FaSpinner } from 'react-icons/fa'
import { cn } from '@/lib/utils'

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
}

export function Combobox({
	value = '',
	onChange,
	options: staticOptions,
	loadOptions,
	selectedLabel,
	placeholder = 'Tanlang...',
	searchPlaceholder = 'Qidirish...',
	emptyText = 'Hech narsa topilmadi',
	loadingText = 'Yuklanmoqda...',
	disabled = false,
	debounceMs = 300,
	className,
	contentClassName,
}: ComboboxProps) {
	const isAsync = typeof loadOptions === 'function'

	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [items, setItems] = useState<ComboboxOption[]>(staticOptions ?? [])
	const [hasMore, setHasMore] = useState(false)
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [highlighted, setHighlighted] = useState(0)
	const [knownLabels, setKnownLabels] = useState<Record<string, string>>({})

	const requestId = useRef(0)
	const listRef = useRef<HTMLDivElement>(null)

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
		if (append) setLoadingMore(true)
		else setLoading(true)
		try {
			const result = await loadOptions({ search: searchTerm, page: pageNum })
			if (thisRequest !== requestId.current) return
			setItems((prev) => (append ? [...prev, ...result.options] : result.options))
			setHasMore(result.hasMore)
			setPage(pageNum)
			setHighlighted(0)
		} finally {
			if (thisRequest === requestId.current) {
				setLoading(false)
				setLoadingMore(false)
			}
		}
	}

	useEffect(() => {
		if (!isAsync || !open) return
		const timer = setTimeout(
			() => {
				fetchOptions(search, 1, false)
			},
			search ? debounceMs : 0,
		)
		return () => clearTimeout(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, open, isAsync])

	useEffect(() => {
		if (!open) setSearch('')
	}, [open])

	const filteredItems = useMemo(() => {
		if (isAsync) return items
		const q = search.trim().toLowerCase()
		if (!q) return items
		return items.filter((item) => item.label.toLowerCase().includes(q))
	}, [isAsync, items, search])

	const handleScroll = () => {
		if (!isAsync || !hasMore || loading || loadingMore) return
		const el = listRef.current
		if (!el) return
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
			fetchOptions(search, page + 1, true)
		}
	}

	const handleSelect = (option: ComboboxOption) => {
		onChange?.(option.value, option)
		setOpen(false)
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setHighlighted((h) => Math.min(h + 1, filteredItems.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setHighlighted((h) => Math.max(h - 1, 0))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			const option = filteredItems[highlighted]
			if (option) handleSelect(option)
		}
	}

	const currentLabel = value
		? (selectedLabel ?? knownLabels[value] ?? staticOptions?.find((o) => o.value === value)?.label ?? '')
		: ''

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
			<PopoverPrimitive.Trigger asChild>
				<button
					type='button'
					disabled={disabled}
					className={cn(
						'flex h-[30px] w-full items-center justify-between gap-2 rounded-[3px] border border-[#ccd0d4] bg-white px-2 text-xs text-ca-heading',
						'focus:border-[#9fa2a5] focus:outline-none',
						'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
						className,
					)}
				>
					<span className={cn('truncate text-left', !currentLabel && 'text-ca-text')}>
						{currentLabel || placeholder}
					</span>
					<FaChevronDown className='shrink-0 text-[10px] text-ca-text' />
				</button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					align='start'
					sideOffset={4}
					className={cn(
						'z-[1070] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[3px] border border-ca-border bg-white text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]',
						contentClassName,
					)}
				>
					<div className='flex items-center gap-2 border-b border-ca-border px-2 py-1.5'>
						<FaSearch className='shrink-0 text-[10px] text-ca-text' />
						<input
							autoFocus
							value={search}
							onChange={(e) => {
								setSearch(e.target.value)
								setHighlighted(0)
							}}
							onKeyDown={handleSearchKeyDown}
							placeholder={searchPlaceholder}
							className='w-full border-none text-xs text-ca-heading outline-none placeholder:text-ca-text'
						/>
					</div>
					<div ref={listRef} onScroll={handleScroll} className='max-h-[240px] overflow-y-auto p-1'>
						{filteredItems.map((option, index) => (
							<div
								key={option.value}
								onClick={() => handleSelect(option)}
								onMouseEnter={() => setHighlighted(index)}
								className={cn(
									'flex cursor-pointer items-center justify-between rounded-[2px] px-2.5 py-1.5 text-ca-heading select-none',
									(index === highlighted || option.value === value) && 'bg-[#edf0f5]',
								)}
							>
								<span className='truncate'>{option.label}</span>
								{option.value === value && <FaCheck className='shrink-0 text-[10px] text-ca-theme' />}
							</div>
						))}
						{!loading && filteredItems.length === 0 && (
							<div className='px-2.5 py-3 text-center text-ca-text'>{emptyText}</div>
						)}
						{(loading || loadingMore) && (
							<div className='flex items-center justify-center gap-2 px-2.5 py-2 text-ca-text'>
								<FaSpinner className='animate-spin' />
								{loadingText}
							</div>
						)}
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	)
}
