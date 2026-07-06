import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Client, ClientListParams, ClientPayload } from '@/services/client/client.types'

export const clientService = {
  list: async (params?: ClientListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Client>>('/client/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Client>(`/client/${id}/`)
    return data
  },
  create: async (payload: ClientPayload) => {
    const { data } = await apiClient.post<Client>('/client/', payload)
    return data
  },
  update: async (id: number, payload: ClientPayload) => {
    const { data } = await apiClient.put<Client>(`/client/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/client/${id}/`)
  },
}
