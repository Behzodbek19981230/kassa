import { apiClient } from '@/services/api/client'
import { type ListResponse, parseListPage } from '@/services/api/list-page'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  Warehouse,
  WarehouseAllListBrandGroup,
  WarehouseAllListParams,
  WarehouseAllListTotal,
  WarehouseBulkCreatePayload,
  WarehouseBulkCreateResponse,
  WarehouseEditRealPricePayload,
  WarehouseListParams,
  WarehousePayload,
  WarehouseSkladProductsPayload,
  WarehouseSkladProductsResponse,
} from '@/services/warehouse/warehouse.types'

type AllListResponse =
  | WarehouseAllListBrandGroup[]
  | (ListResponse<WarehouseAllListBrandGroup> & { total?: WarehouseAllListTotal | null })

const WAREHOUSE_ALL_LIST_PAGE_SIZE = 50

async function fetchAllListPage(params: WarehouseAllListParams | undefined, page: number) {
  const { data } = await apiClient.get<AllListResponse>('/warehouse/all-list/', {
    params: { ...params, page, limit: WAREHOUSE_ALL_LIST_PAGE_SIZE },
  })
  return data
}

// A brand or category can be split across pages, so the groups are merged by id.
export function mergeBrandGroups(groups: WarehouseAllListBrandGroup[]): WarehouseAllListBrandGroup[] {
  const brands = new Map<number, WarehouseAllListBrandGroup>()
  for (const group of groups) {
    const brand = brands.get(group.brand.id)
    if (!brand) {
      brands.set(group.brand.id, {
        brand: group.brand,
        product_categories: group.product_categories.map((category) => ({ ...category, warehouses: [...category.warehouses] })),
      })
      continue
    }
    for (const category of group.product_categories) {
      const existing = brand.product_categories.find((c) => c.product_category.id === category.product_category.id)
      if (existing) existing.warehouses.push(...category.warehouses)
      else brand.product_categories.push({ ...category, warehouses: [...category.warehouses] })
    }
  }
  return [...brands.values()]
}

// Walks every page in order; used where the whole catalog is needed at once.
async function fetchAllListGroups(params: WarehouseAllListParams | undefined): Promise<WarehouseAllListBrandGroup[]> {
  const groups: WarehouseAllListBrandGroup[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const parsed = parseListPage(await fetchAllListPage(params, page), page)
    groups.push(...parsed.results)
    hasMore = parsed.nextPage !== undefined
    page += 1
  }
  return groups
}

export const warehouseService = {
  list: async (params?: WarehouseListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Warehouse>>('/warehouse/', { params })
    return data
  },
  allListPage: async (params: WarehouseAllListParams | undefined, page: number) => {
    const data = await fetchAllListPage(params, page)
    const total = Array.isArray(data) ? null : (data.total ?? null)
    return { ...parseListPage(data, page), total }
  },
  allList: async (params?: WarehouseAllListParams) => {
    return mergeBrandGroups(await fetchAllListGroups(params))
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Warehouse>(`/warehouse/${id}/`)
    return data
  },
  create: async (payload: WarehousePayload) => {
    const { data } = await apiClient.post<Warehouse>('/warehouse/', payload)
    return data
  },
  // Adds products to one or several skladlar in a single transaction; the backend finds or creates the cards.
  bulkCreate: async (payload: WarehouseBulkCreatePayload) => {
    const { data } = await apiClient.post<WarehouseBulkCreateResponse>('/warehouse/bulk-create/', payload)
    return data
  },
  update: async (id: number, payload: WarehousePayload) => {
    const { data } = await apiClient.put<Warehouse>(`/warehouse/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/warehouse/${id}/`)
  },
  getSkladProducts: async (id: number) => {
    const { data } = await apiClient.get<WarehouseSkladProductsResponse>(`/warehouse/${id}/sklad-products/`)
    return data
  },
  updateSkladProducts: async (id: number, payload: WarehouseSkladProductsPayload) => {
    const { data } = await apiClient.put<WarehouseSkladProductsResponse>(`/warehouse/${id}/sklad-products/`, payload)
    return data
  },
  // The product card for a variant (cards no longer carry a sklad), or null when it isn't registered yet.
  findCard: async (variant: { brand: number; product_category: number; type: number | null; size: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Warehouse>>('/warehouse/', {
      params: {
        brand: variant.brand,
        product_category: variant.product_category,
        type: variant.type ?? undefined,
        limit: 100,
      },
    })
    return data.results.find((w) => Number(w.size) === variant.size) ?? null
  },
  editRealPrice: async (id: number, payload: WarehouseEditRealPricePayload) => {
    const { data } = await apiClient.patch<Warehouse>(`/warehouse/${id}/edit-real-price/`, payload)
    return data
  },
}
