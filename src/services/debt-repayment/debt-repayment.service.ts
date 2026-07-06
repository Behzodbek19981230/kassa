import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  DebtRepayment,
  DebtRepaymentListParams,
  DebtRepaymentPayload,
} from '@/services/debt-repayment/debt-repayment.types'

export const debtRepaymentService = {
  list: async (params?: DebtRepaymentListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<DebtRepayment>>('/debt-repayment/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<DebtRepayment>(`/debt-repayment/${id}/`)
    return data
  },
  create: async (payload: DebtRepaymentPayload) => {
    const { data } = await apiClient.post<DebtRepayment>('/debt-repayment/', payload)
    return data
  },
  update: async (id: number, payload: DebtRepaymentPayload) => {
    const { data } = await apiClient.put<DebtRepayment>(`/debt-repayment/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/debt-repayment/${id}/`)
  },
}
