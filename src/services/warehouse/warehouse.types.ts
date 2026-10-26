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
  real_price: number
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
  is_active?: boolean
}

/** One product (card) of a bulk create; see docs/backend-warehouse-prices-create.md. */
export interface WarehouseBulkCreateItem {
  brand: number
  product_category: number
  type: number | null
  size: number | string
  real_price: string | number
}

export interface WarehouseBulkCreatePayload {
  /** Every product in items is added to each of these skladlar. */
  type_sklads: number[]
  cr_date: string
  comment?: string
  items: WarehouseBulkCreateItem[]
}

export interface WarehouseBulkCreateRef {
  id: number
  name: string
}

/** A sklad row that already existed (left untouched) or was created by the request. */
export interface WarehouseBulkCreateSkladRow {
  sklad_product_id: number
  warehouse_id: number
  type_sklad: WarehouseBulkCreateRef
  count: number
  real_price: string | null
  cr_date: string | null
  message?: string
}

export interface WarehouseBulkCreateResult {
  item_index: number
  warehouse_id: number
  product_created: boolean
  product: {
    brand: WarehouseBulkCreateRef
    product_category: WarehouseBulkCreateRef
    type: WarehouseBulkCreateRef | null
    size: string
  }
  /** Skladlar that already held the product; nothing was changed there. */
  existing: WarehouseBulkCreateSkladRow[]
  created: WarehouseBulkCreateSkladRow[]
}

/** 201 when something was created, 200 when everything already existed - both are a success. */
export interface WarehouseBulkCreateResponse {
  success: boolean
  summary: {
    created_products: number
    created_sklad_products: number
    existing_sklad_products: number
  }
  results: WarehouseBulkCreateResult[]
}

export interface WarehousePayload {
  cr_date: string
  size: number
  count: number
  price: number
  real_price?: number
  worker_price: number
  status_count: boolean
  company: number
  brand: number
  product_category: number
  type: number | null
  type_sklad?: number | null
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

// Shape of one warehouse row in `warehouse/all-list/` and `design/china-products/`. Decimals arrive as strings.
export interface WarehouseAllListItem {
  id: number
  /** Product card id, when the row's `id` is its stock row; read through `catalogCardId`. */
  warehouse_id?: number | null
  /** This row's stock in its sklad; read through `resolveCatalogStockId`. */
  sklad_product_id?: number | null
  company_id: number
  brand_id: number
  brand_name: string
  product_category_id: number
  product_category_name: string
  type_sklad_id: number | null
  type_sklad_name: string | null
  type_id: number | null
  type_name: string | null
  size: string
  count: number
  real_price: string
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

// Catalog-wide counts the backend sends with every `warehouse/all-list/` page.
export interface WarehouseAllListTotal {
  warehouse_total: number
  brand_total: number
  product_category_total: number
}

export interface WarehouseAllListParams {
  brand?: number
  product_category?: number
  is_active?: boolean
}

/** `warehouse/sklad-list/` — same shape as all-list, limited to one sklad's stock. */
export interface WarehouseSkladListParams extends WarehouseAllListParams {
  type_sklad: number
}

export interface WarehouseEditRealPricePayload {
  real_price: number
}

/** GET/PUT /warehouse/{id}/sklad-products/ — the product's stock rows in every sklad, edited together. */
export interface WarehouseSkladProductsRef {
  id: number
  name: string
}

export interface WarehouseSkladProductRow {
  id: number
  type_sklad: number
  type_sklad_name: string
  count: number
  real_price: string | null
  worker_price: string | null
  updated_time: string
}

export interface WarehouseSkladProductsResponse {
  warehouse: {
    id: number
    model: WarehouseSkladProductsRef
    product_category: WarehouseSkladProductsRef
    size: string
    type: WarehouseSkladProductsRef | null
    total_count: number
    is_active?: boolean
  }
  sklad_products: WarehouseSkladProductRow[]
}

/** Existing rows send back `id` and `updated_time` (409 when stale); new rows send `id: null`; omitted rows are deleted. */
export interface WarehouseSkladProductsPayloadRow {
  id: number | null
  type_sklad: number
  count: number
  real_price: string
  worker_price: string
  updated_time?: string
}

export interface WarehouseSkladProductsPayload {
  is_active: boolean
  sklad_products: WarehouseSkladProductsPayloadRow[]
}
