import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { SkladType, SkladTypeListParams, SkladTypePayload } from '@/services/sklad-type/sklad-type.types'

export const skladTypeService = {
  list: async (params?: SkladTypeListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<SkladType>>('/type-sklad/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<SkladType>(`/type-sklad/${id}/`)
    return data
  },
  create: async (payload: SkladTypePayload) => {
    const { data } = await apiClient.post<SkladType>('/type-sklad/', payload)
    return data
  },
  update: async (id: number, payload: SkladTypePayload) => {
    const { data } = await apiClient.put<SkladType>(`/type-sklad/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/type-sklad/${id}/`)
  },
}
