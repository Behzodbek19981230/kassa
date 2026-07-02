import type { ListParams } from '@/services/api/types'

export interface BrandSizeType {
  id: number
  created_time: string
  updated_time: string
  name: string
  sorting: number
  status: boolean
  created_by: number
  updated_by: number | null
}

export interface BrandSizeTypePayload {
  name: string
  sorting: number
  status: boolean
}

export type BrandSizeTypeListParams = ListParams

export interface BrandSizeTypeNextSorting {
  model: string
  app: string
  filters: Record<string, unknown>
  first_empty_sorting: number
  message: string
}
