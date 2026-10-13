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

export interface TelegramBroadcastNamedDetail {
  id: number
  name: string
}

export interface TelegramBroadcastWarehouse {
  id: number
  company_detail?: TelegramBroadcastNamedDetail | null
  brand_detail?: TelegramBroadcastNamedDetail | null
  product_category_detail?: TelegramBroadcastNamedDetail | null
  type_sklad_detail?: TelegramBroadcastNamedDetail | null
  type_detail?: TelegramBroadcastNamedDetail | null
  size: string
  count: number
  cr_date: string
  real_price: string
  worker_price: string
  status_count: boolean
}

export interface TelegramBroadcastDelivery {
  id: number
  job: number
  job_status: TelegramBroadcastStatus
  client: number | null
  telegram_id?: string | number | null
  warehouse: number | null
  warehouse_name?: string | null
  status: TelegramBroadcastDeliveryStatus
  message_id: number | null
  error?: string | null
  sent_at?: string | null
  created_at: string
}

export interface TelegramBroadcastJob {
  id: number
  company: number
  text: string | null
  image?: string | null
  status: TelegramBroadcastStatus
  total_count: number
  sent_count: number
  failed_count: number
  warehouse_ids: number[]
  warehouses?: TelegramBroadcastWarehouse[]
  client_ids: number[]
  error?: string | null
  created_at: string
  started_at?: string | null
  finished_at?: string | null
  deliveries?: TelegramBroadcastDelivery[]
}

export interface TelegramBroadcastCreatePayload {
  client_ids: number[]
  warehouse_ids?: number[]
  text?: string
  image?: File | null
}

/** For `POST /telegram/warehouse-broadcast/all/` — backend resolves the client list itself. */
export interface TelegramBroadcastCreateAllPayload {
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
