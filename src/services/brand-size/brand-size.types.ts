import type { ListParams } from '@/services/api/types'

export interface BrandSize {
  id: number
  created_time: string
  updated_time: string
  size: string
  type: number
  created_by: number
  updated_by: number | null
  brand: number
  product_category: number
}

export interface BrandSizePayload {
  size: number
  type: number
  brand: number
  product_category: number
}

export interface BrandSizeListParams extends ListParams {
  brand?: number
  product_category?: number
  type?: number
}
