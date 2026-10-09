import { apiClient } from '@/services/api/client'
import { type ListResponse, parseListPage } from '@/services/api/list-page'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  Warehouse,
  WarehouseAllListBrandGroup,
  WarehouseAllListParams,
  WarehouseEditRealPricePayload,
  WarehouseListParams,
  WarehousePayload,
} from '@/services/warehouse/warehouse.types'

type AllListResponse = WarehouseAllListBrandGroup[] | ListResponse<WarehouseAllListBrandGroup>

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
    return parseListPage(await fetchAllListPage(params, page), page)
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
  update: async (id: number, payload: WarehousePayload) => {
    const { data } = await apiClient.put<Warehouse>(`/warehouse/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/warehouse/${id}/`)
  },
  editRealPrice: async (id: number, payload: WarehouseEditRealPricePayload) => {
    const { data } = await apiClient.patch<Warehouse>(`/warehouse/${id}/edit-real-price/`, payload)
    return data
  },
}
