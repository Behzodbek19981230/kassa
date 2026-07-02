import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  BrandSize,
  BrandSizeListParams,
  BrandSizePayload,
} from '@/services/brand-size/brand-size.types'

export const brandSizeService = {
  list: async (params?: BrandSizeListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<BrandSize>>('/brand-size/', { params })
    return data
  },
  create: async (payload: BrandSizePayload) => {
    const { data } = await apiClient.post<BrandSize>('/brand-size/', payload)
    return data
  },
  update: async (id: number, payload: BrandSizePayload) => {
    const { data } = await apiClient.put<BrandSize>(`/brand-size/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/brand-size/${id}/`)
  },
}
