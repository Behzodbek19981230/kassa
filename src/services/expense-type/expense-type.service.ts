import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  ExpenseType,
  ExpenseTypeListParams,
  ExpenseTypePayload,
} from '@/services/expense-type/expense-type.types'

export const expenseTypeService = {
  list: async (params?: ExpenseTypeListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<ExpenseType>>('/type-expense/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<ExpenseType>(`/type-expense/${id}/`)
    return data
  },
  create: async (payload: ExpenseTypePayload) => {
    const { data } = await apiClient.post<ExpenseType>('/type-expense/', payload)
    return data
  },
  update: async (id: number, payload: ExpenseTypePayload) => {
    const { data } = await apiClient.put<ExpenseType>(`/type-expense/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/type-expense/${id}/`)
  },
}
