import type { ListParams } from '@/services/api/types'

export type TelegramBroadcastStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'partial'
  | 'failed'
  | 'deleting'
  | 'deleted'
  | 'partial_deleted'
  | 'cancelled'

export type TelegramBroadcastDeliveryStatus = 'pending' | 'sent' | 'failed' | 'cancelled' | 'deleted' | 'delete_failed'

export const BROADCAST_STATUS_OPTIONS: { value: TelegramBroadcastStatus; label: string }[] = [
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'processing', label: 'Yuborilmoqda' },
  { value: 'done', label: 'Yakunlandi' },
  { value: 'partial', label: 'Qisman bajarildi' },
  { value: 'failed', label: 'Xato' },
  { value: 'deleting', label: "O'chirilmoqda" },
  { value: 'deleted', label: "O'chirildi" },
  { value: 'partial_deleted', label: "Qisman o'chirildi" },
  { value: 'cancelled', label: 'Bekor qilindi' },
]

export const DELIVERY_STATUS_OPTIONS: { value: TelegramBroadcastDeliveryStatus; label: string }[] = [
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'sent', label: 'Yuborildi' },
  { value: 'failed', label: 'Xato' },
  { value: 'cancelled', label: 'Bekor qilindi' },
  { value: 'deleted', label: "O'chirildi" },
  { value: 'delete_failed', label: "O'chmadi" },
]

export interface TelegramBroadcastClientDetail {
  id: number
  fio: string
  phone?: string
}

export interface TelegramBroadcastWarehouseDetail {
  id: number
  brand_detail?: { id: number; name: string } | null
  product_category_detail?: { id: number; name: string } | null
  size?: number
}

export interface TelegramBroadcastDelivery {
  id: number
  client: number
  client_detail?: TelegramBroadcastClientDetail | null
  telegram_id?: string | number | null
  warehouse: number | null
  warehouse_detail?: TelegramBroadcastWarehouseDetail | null
  status: TelegramBroadcastDeliveryStatus
  message_id: number | null
  error?: string | null
  sent_time?: string | null
}

export interface TelegramBroadcastJob {
  id: number
  text: string | null
  image: string | null
  status: TelegramBroadcastStatus
  clients_count: number
  warehouses_count: number
  total_count: number
  sent_count: number
  error_count: number
  created_time: string
  deliveries?: TelegramBroadcastDelivery[]
}

export interface TelegramBroadcastCreatePayload {
  client_ids: number[]
  warehouse_ids?: number[]
  text?: string
  image?: File | null
}

export interface TelegramBroadcastCreateResponse {
  ok: boolean
  job_id: number
  status: TelegramBroadcastStatus
  clients_count: number
  warehouses_count: number
  total_count: number
  status_url: string
}

export interface TelegramBroadcastDeleteResponse {
  ok: boolean
  job_id: number
  status: TelegramBroadcastStatus
  detail: string
}

export interface TelegramBroadcastRetryDeleteResponse {
  ok: boolean
  job_id: number
  status: TelegramBroadcastStatus
  retry_count: number
  detail: string
}

export interface TelegramBroadcastDeliveryRetryDeleteResponse {
  ok: boolean
  delivery_id: number
  status: TelegramBroadcastDeliveryStatus
  detail: string
}

export interface TelegramBroadcastListParams extends ListParams {
  status?: TelegramBroadcastStatus
}

export interface TelegramBroadcastDetailParams {
  delivery_limit?: number
}
