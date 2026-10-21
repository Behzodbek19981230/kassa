import type { ListParams } from '@/services/api/types'

export interface KeshbekHistoryUserDetail {
  id: number
  username: string
  first_name: string
  last_name: string
}

/** One cashback movement of a client (`/keshbek-history/`). */
export interface KeshbekHistory {
  id: number
  client: number
  /** Signed change: positive when cashback is accrued, negative when it's spent. */
  amount: string | number
  keshbek_before?: string | number | null
  keshbek_after?: string | number | null
  type?: string | null
  comment?: string | null
  order?: number | null
  created_time: string
  created_by_detail?: KeshbekHistoryUserDetail | null
}

export interface KeshbekHistoryListParams extends ListParams {
  client?: number
}
