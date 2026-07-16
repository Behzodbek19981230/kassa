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

export interface WarehouseSkladTypeDetail {
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
  type_sklad: number | null
  type_sklad_detail?: WarehouseSkladTypeDetail | null
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
  type_sklad: number | null
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
  brand?: number
  product_category?: number
  type?: number
  type_sklad?: number
  status_count?: boolean
}

export interface WarehouseAllListItem {
  id: number
  company_id: number
  brand_id: number
  product_category_id: number
  size: number
  count: number
  cr_date: string
  price: number
  all_sum_dollar: number
  all_discount_amount: number
  all_my_total_debt: number
  status_count: boolean
  worker_price: number
  type_sklad_id: number | null
  type_sklad_name: string | null
  brand_name: string
  product_category_name: string
  type_id: number | null
  type_name: string | null
  image: string | null
}

export interface WarehouseAllListCategoryGroup {
  product_category: {
    id: number
    name: string
    brand: number
    sorting: number
    status: number
    sup_status: number
  }
  warehouses: WarehouseAllListItem[]
}

export interface WarehouseAllListBrandGroup {
  brand: {
    id: number
    name: string
    sorting: number
    status: number
    sup_status: number
  }
  product_categories: WarehouseAllListCategoryGroup[]
}

export interface WarehouseAllListParams {
  brand?: number
  product_category?: number
}
