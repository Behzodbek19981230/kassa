import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Expense, ExpenseListParams, ExpensePayload } from '@/services/expense/expense.types'

export const expenseService = {
  list: async (params?: ExpenseListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Expense>>('/expense/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Expense>(`/expense/${id}/`)
    return data
  },
  create: async (payload: ExpensePayload) => {
    const { data } = await apiClient.post<Expense>('/expense/', payload)
    return data
  },
  update: async (id: number, payload: ExpensePayload) => {
    const { data } = await apiClient.put<Expense>(`/expense/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/expense/${id}/`)
  },
}
