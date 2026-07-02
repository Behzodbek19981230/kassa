import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  BrandSizeType,
  BrandSizeTypeListParams,
  BrandSizeTypeNextSorting,
  BrandSizeTypePayload,
} from '@/services/brand-size-type/brand-size-type.types'

export const brandSizeTypeService = {
  list: async (params?: BrandSizeTypeListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<BrandSizeType>>('/brand-size-type/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<BrandSizeType>(`/brand-size-type/${id}/`)
    return data
  },
  getNextSorting: async () => {
    const { data } = await apiClient.get<BrandSizeTypeNextSorting>('/brand-size-type/sorting/')
    return data
  },
  create: async (payload: BrandSizeTypePayload) => {
    const { data } = await apiClient.post<BrandSizeType>('/brand-size-type/', payload)
    return data
  },
  update: async (id: number, payload: BrandSizeTypePayload) => {
    const { data } = await apiClient.put<BrandSizeType>(`/brand-size-type/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/brand-size-type/${id}/`)
  },
}
