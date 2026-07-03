import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { User, UserListParams, UserPayload } from '@/services/user/user.types'

export const userService = {
  getMe: async () => {
    const { data } = await apiClient.get<User>('/user-info/')
    return data
  },
  list: async (params?: UserListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/user/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<User>(`/user/${id}/`)
    return data
  },
  create: async (payload: UserPayload) => {
    const { data } = await apiClient.post<User>('/user/', payload)
    return data
  },
  update: async (id: number, payload: UserPayload) => {
    const { data } = await apiClient.put<User>(`/user/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/user/${id}/`)
  },
}
