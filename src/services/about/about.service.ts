import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { About, AboutListParams, AboutPayload } from '@/services/about/about.types'

export const aboutService = {
  list: async (params?: AboutListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<About>>('/about/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<About>(`/about/${id}/`)
    return data
  },
  create: async (payload: AboutPayload) => {
    const { data } = await apiClient.post<About>('/about/', payload)
    return data
  },
  update: async (id: number, payload: AboutPayload) => {
    const { data } = await apiClient.put<About>(`/about/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/about/${id}/`)
  },
}
