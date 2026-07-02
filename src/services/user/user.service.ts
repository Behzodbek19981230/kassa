import { apiClient } from '@/services/api/client'
import type { User } from '@/services/user/user.types'

export const userService = {
  getMe: async () => {
    const { data } = await apiClient.get<User>('/user-info/')
    return data
  },
}
