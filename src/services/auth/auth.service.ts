import { apiClient } from '@/services/api/client'
import type { LoginRequest, LoginResponse, LogoutRequest } from '@/services/auth/auth.types'

export const authService = {
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/token/', payload)
    return data
  },
  logout: async (payload: LogoutRequest) => {
    await apiClient.post('/auth/logout/', payload)
  },
}
