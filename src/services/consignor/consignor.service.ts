import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Consignor, ConsignorListParams, ConsignorPayload } from '@/services/consignor/consignor.types'

export const consignorService = {
  list: async (params?: ConsignorListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Consignor>>('/consignor/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Consignor>(`/consignor/${id}/`)
    return data
  },
  create: async (payload: ConsignorPayload) => {
    const { data } = await apiClient.post<Consignor>('/consignor/', payload)
    return data
  },
  update: async (id: number, payload: ConsignorPayload) => {
    const { data } = await apiClient.put<Consignor>(`/consignor/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/consignor/${id}/`)
  },
}
