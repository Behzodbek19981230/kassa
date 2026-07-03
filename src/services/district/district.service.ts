import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { District, DistrictListParams, DistrictPayload } from '@/services/district/district.types'

export const districtService = {
  list: async (params?: DistrictListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<District>>('/district/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<District>(`/district/${id}/`)
    return data
  },
  create: async (payload: DistrictPayload) => {
    const { data } = await apiClient.post<District>('/district/', payload)
    return data
  },
  update: async (id: number, payload: DistrictPayload) => {
    const { data } = await apiClient.put<District>(`/district/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/district/${id}/`)
  },
}
