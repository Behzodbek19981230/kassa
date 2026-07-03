import { useDismissableLayerSurface } from '@radix-ui/react-dismissable-layer'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaCheck, FaChevronDown, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa'
import { cn } from '@/lib/utils'
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

export function MultiCombobox({
  value = [],
  onChange,
  options: staticOptions,
  loadOptions,
  selectedLabels,
  placeholder = 'Tanlang...',
  searchPlaceholder = 'Qidirish...',
  emptyText = 'Hech narsa topilmadi',
  loadingText = 'Yuklanmoqda...',
  disabled = false,
  debounceMs = 300,
  className,
  contentClassName,
}: MultiComboboxProps) {
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
  const registerSurface = useDismissableLayerSurface()

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

  const toggleValue = (option: ComboboxOption) => {
    const next = value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value]
    onChange?.(next)
  }

  const removeValue = (v: string) => {
    onChange?.(value.filter((x) => x !== v))
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
      if (option) toggleValue(option)
    }
  }

  const labelFor = (v: string) =>
    selectedLabels?.[v] ?? knownLabels[v] ?? staticOptions?.find((o) => o.value === v)?.label ?? v

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex min-h-[34px] w-full flex-wrap items-center gap-1 rounded-[3px] border border-[#ccd0d4] bg-white px-2 py-1 text-xs text-ca-heading',
            'focus:border-[#9fa2a5] focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-[#e5e9ed] disabled:opacity-60',
            className,
          )}
        >
          {value.length === 0 ? (
            <span className="px-1 text-ca-text">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="flex items-center gap-1 rounded-[2px] bg-[#edf0f5] px-1.5 py-0.5 text-ca-heading"
              >
                <span className="max-w-[140px] truncate">{labelFor(v)}</span>
                <FaTimes
                  className="shrink-0 text-[9px] text-ca-text hover:text-ca-heading"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    removeValue(v)
                  }}
                />
              </span>
            ))
          )}
          <FaChevronDown className="ml-auto shrink-0 text-[10px] text-ca-text" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={registerSurface}
          align="start"
          sideOffset={4}
          className={cn(
            'z-[1070] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[3px] border border-ca-border bg-white text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)]',
            contentClassName,
          )}
        >
          <div className="flex items-center gap-2 border-b border-ca-border px-2 py-1.5">
            <FaSearch className="shrink-0 text-[10px] text-ca-text" />
            <input
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlighted(0)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className="w-full border-none text-xs text-ca-heading outline-none placeholder:text-ca-text"
            />
          </div>
          <div ref={listRef} onScroll={handleScroll} className="max-h-[240px] overflow-y-auto p-1">
            {filteredItems.map((option, index) => {
              const selected = value.includes(option.value)
              return (
                <div
                  key={option.value}
                  onClick={() => toggleValue(option)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-[2px] px-2.5 py-1.5 text-ca-heading select-none',
                    (index === highlighted || selected) && 'bg-[#edf0f5]',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <FaCheck className="shrink-0 text-[10px] text-ca-theme" />}
                </div>
              )
            })}
            {!loading && filteredItems.length === 0 && (
              <div className="px-2.5 py-3 text-center text-ca-text">{emptyText}</div>
            )}
            {(loading || loadingMore) && (
              <div className="flex items-center justify-center gap-2 px-2.5 py-2 text-ca-text">
                <FaSpinner className="animate-spin" />
                {loadingText}
              </div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
