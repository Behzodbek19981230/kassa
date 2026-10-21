import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { KeshbekHistory, KeshbekHistoryListParams } from '@/services/keshbek-history/keshbek-history.types'

export const keshbekHistoryService = {
  list: async (params?: KeshbekHistoryListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<KeshbekHistory>>('/keshbek-history/', { params })
    return data
  },
}
