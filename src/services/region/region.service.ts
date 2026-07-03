import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Region, RegionListParams, RegionPayload } from '@/services/region/region.types'

export const regionService = {
  list: async (params?: RegionListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Region>>('/region/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Region>(`/region/${id}/`)
    return data
  },
  create: async (payload: RegionPayload) => {
    const { data } = await apiClient.post<Region>('/region/', payload)
    return data
  },
  update: async (id: number, payload: RegionPayload) => {
    const { data } = await apiClient.put<Region>(`/region/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/region/${id}/`)
  },
}
