import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  Warehouse,
  WarehouseAllListBrandGroup,
  WarehouseAllListParams,
  WarehouseListParams,
  WarehousePayload,
} from '@/services/warehouse/warehouse.types'

export const warehouseService = {
  list: async (params?: WarehouseListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Warehouse>>('/warehouse/', { params })
    return data
  },
  allList: async (params?: WarehouseAllListParams) => {
    const { data } = await apiClient.get<WarehouseAllListBrandGroup[]>('/warehouse/all-list/', { params })
    return data
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
}
