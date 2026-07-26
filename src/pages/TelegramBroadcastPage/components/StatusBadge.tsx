import { Badge } from '@/components/ui'
import type { BadgeProps } from '@/components/ui/Badge'
import {
  BROADCAST_STATUS_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
  type TelegramBroadcastDeliveryStatus,
  type TelegramBroadcastStatus,
} from '@/services/telegram-broadcast/telegram-broadcast.types'

const broadcastStatusLabels = new Map(BROADCAST_STATUS_OPTIONS.map((o) => [o.value, o.label]))
const deliveryStatusLabels = new Map(DELIVERY_STATUS_OPTIONS.map((o) => [o.value, o.label]))

const broadcastStatusVariants: Record<TelegramBroadcastStatus, BadgeProps['variant']> = {
  pending: 'default',
  processing: 'primary',
  done: 'success',
  partial: 'warning',
  failed: 'danger',
  deleting: 'info',
  deleted: 'default',
  partial_deleted: 'warning',
  cancelled: 'default',
}

const deliveryStatusVariants: Record<TelegramBroadcastDeliveryStatus, BadgeProps['variant']> = {
  pending: 'default',
  sent: 'success',
  failed: 'danger',
  cancelled: 'default',
  deleted: 'default',
  delete_failed: 'danger',
}

export function BroadcastStatusBadge({ status }: { status: TelegramBroadcastStatus }) {
  return <Badge variant={broadcastStatusVariants[status] ?? 'default'}>{broadcastStatusLabels.get(status) ?? status}</Badge>
}

export function DeliveryStatusBadge({ status }: { status: TelegramBroadcastDeliveryStatus }) {
  return <Badge variant={deliveryStatusVariants[status] ?? 'default'}>{deliveryStatusLabels.get(status) ?? status}</Badge>
}
