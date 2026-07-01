import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FaTimes } from 'react-icons/fa'
import { cn } from '@/lib/utils'

export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface NotificationOptions {
  title: string
  text?: string
  image?: string
  variant?: 'default' | 'light'
  sticky?: boolean
  duration?: number
  beforeOpen?: () => boolean | void
  afterOpen?: () => void
  beforeClose?: (manual: boolean) => void
  afterClose?: (manual: boolean) => void
}

interface NotificationItem extends NotificationOptions {
  id: string
}

interface NotificationContextValue {
  notify: (options: NotificationOptions) => string | null
  dismiss: (id: string, manual?: boolean) => void
  dismissAll: (callbacks?: { beforeClose?: () => void; afterClose?: () => void }) => void
  position: NotificationPosition
  setPosition: (position: NotificationPosition) => void
  maxVisible: number
  setMaxVisible: (max: number) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const positionClasses: Record<NotificationPosition, string> = {
  'top-right': 'top-5 right-5',
  'top-left': 'top-5 left-5',
  'bottom-right': 'bottom-5 right-5',
  'bottom-left': 'bottom-5 left-5',
}

function NotificationToast({
  item,
  onDismiss,
}: {
  item: NotificationItem
  onDismiss: (manual: boolean) => void
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLight = item.variant === 'light'

  useEffect(() => {
    item.afterOpen?.()
    requestAnimationFrame(() => setVisible(true))

    if (!item.sticky) {
      timerRef.current = setTimeout(() => onDismiss(false), item.duration ?? 4000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item, onDismiss])

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => onDismiss(true), 150)
  }

  return (
    <div
      className={cn(
        'relative mb-2.5 w-[301px] overflow-hidden rounded-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-150',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
        isLight ? 'bg-white text-[#222]' : 'bg-[#222] text-[#eee]',
      )}
    >
      <div className="flex gap-2.5 p-2.5 pr-8">
        {item.image && (
          <img
            src={item.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded-[3px] object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'mb-1.5 text-sm font-bold',
              !isLight && 'text-shadow-[1px_1px_0_#000]',
            )}
          >
            {item.title}
          </div>
          {item.text && <p className="m-0 text-[11px] leading-relaxed">{item.text}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          'absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded opacity-70 transition-opacity hover:opacity-100',
          isLight ? 'text-[#333]' : 'text-[#eee]',
        )}
        aria-label="Close notification"
      >
        <FaTimes className="text-[10px]" />
      </button>
    </div>
  )
}

export function NotificationProvider({
  children,
  defaultPosition = 'top-right',
  defaultMaxVisible = 10,
}: {
  children: ReactNode
  defaultPosition?: NotificationPosition
  defaultMaxVisible?: number
}) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [position, setPosition] = useState<NotificationPosition>(defaultPosition)
  const [maxVisible, setMaxVisible] = useState(defaultMaxVisible)

  const dismiss = useCallback((id: string, manual = false) => {
    setItems((prev) => {
      const item = prev.find((n) => n.id === id)
      if (item) {
        item.beforeClose?.(manual)
        item.afterClose?.(manual)
      }
      return prev.filter((n) => n.id !== id)
    })
  }, [])

  const dismissAll = useCallback(
    (callbacks?: { beforeClose?: () => void; afterClose?: () => void }) => {
      callbacks?.beforeClose?.()
      setItems((prev) => {
        prev.forEach((item) => {
          item.beforeClose?.(false)
          item.afterClose?.(false)
        })
        return []
      })
      callbacks?.afterClose?.()
    },
    [],
  )

  const notify = useCallback(
    (options: NotificationOptions) => {
      if (options.beforeOpen?.() === false) return null

      let createdId: string | null = null
      setItems((prev) => {
        if (prev.length >= maxVisible) return prev
        const id = crypto.randomUUID()
        createdId = id
        return [...prev, { ...options, id }]
      })
      return createdId
    },
    [maxVisible],
  )

  const value = useMemo(
    () => ({ notify, dismiss, dismissAll, position, setPosition, maxVisible, setMaxVisible }),
    [notify, dismiss, dismissAll, position, maxVisible],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className={cn('pointer-events-none fixed z-[9999]', positionClasses[position])}
        aria-live="polite"
      >
        <div className="pointer-events-auto">
          {items.map((item) => (
            <NotificationToast
              key={item.id}
              item={item}
              onDismiss={(manual) => dismiss(item.id, manual)}
            />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return ctx
}
