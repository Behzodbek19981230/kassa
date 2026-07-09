import type { ListParams } from '@/services/api/types'

export interface WarehouseBrandDetail {
  id: number
  name: string
}

export interface WarehouseProductCategoryDetail {
  id: number
  name: string
}

export interface WarehouseTypeDetail {
  id: number
  name: string
}

export interface WarehouseCompanyDetail {
  id: number
  name: string
}

export interface Warehouse {
  id: number
  cr_date: string
  size: number
  count: number
  price: number
  worker_price: number
  all_sum_dollar: number
  all_discount_amount: number
  all_my_total_debt: number
  status_count: boolean
  company: number
  company_detail?: WarehouseCompanyDetail | null
  brand: number
  brand_detail?: WarehouseBrandDetail | null
  product_category: number
  product_category_detail?: WarehouseProductCategoryDetail | null
  type: number | null
  type_detail?: WarehouseTypeDetail | null
  comment?: string | null
}

export interface WarehousePayload {
  cr_date: string
  size: number
  count: number
  price: number
  worker_price: number
  status_count: boolean
  company: number
  brand: number
  product_category: number
  type: number | null
  all_sum_dollar?: number
  all_discount_amount?: number
  all_my_total_debt?: number
  comment?: string
}

export interface WarehouseMoneyPayload {
  all_sum_dollar: number
  all_discount_amount: number
  all_my_total_debt: number
}

export interface WarehouseListParams extends ListParams {
  company?: number
  brand?: number
  product_category?: number
  type?: number
  status_count?: boolean
}
