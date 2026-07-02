import type { ListParams } from '@/services/api/types'

export interface ProductCategory {
  id: number
  created_time: string
  updated_time: string
  name: string
  sorting: number
  status: number
  sup_status: number
  created_by: number
  updated_by: number | null
  brand: number
}

export interface ProductCategoryPayload {
  name: string
  sorting: number
  status: number
  sup_status: number
  brand: number
}

export interface ProductCategoryListParams extends ListParams {
  name?: string
  brand?: number
}
