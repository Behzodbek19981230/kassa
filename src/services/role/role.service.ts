import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Role, RoleListParams } from '@/services/role/role.types'

export const roleService = {
  list: async (params?: RoleListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Role>>('/role/', { params })
    return data
  },
}
