import type { ListParams } from '@/services/api/types'

export interface Brand {
  id: number
  created_time: string
  updated_time: string
  name: string
  sorting: number
  status: number
  sup_status: number
  created_by: number
  updated_by: number | null
}

export interface BrandPayload {
  name: string
  sorting: number
  status: number
  sup_status: number
}

export type BrandListParams = ListParams

export interface BrandNextSorting {
  model: string
  app: string
  filters: Record<string, unknown>
  first_empty_sorting: number
  message: string
}
