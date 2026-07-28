import { apiClient, API_BASE_URL } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  DebtRepayment,
  DebtRepaymentGroupedListParams,
  DebtRepaymentGroupedResponse,
  DebtRepaymentListParams,
  DebtRepaymentPayload,
} from '@/services/debt-repayment/debt-repayment.types'

const API_PATH_PREFIX = new URL(API_BASE_URL).pathname.replace(/\/$/, '')

function toApiPath(url: string) {
  return url.startsWith(API_PATH_PREFIX) ? url.slice(API_PATH_PREFIX.length) : url
}

export const debtRepaymentService = {
  list: async (params?: DebtRepaymentListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<DebtRepayment>>('/debt-repayment/', { params })
    return data
  },
  listGrouped: async (params?: DebtRepaymentGroupedListParams) => {
    const { data } = await apiClient.get<DebtRepaymentGroupedResponse>('/debt-repayment/grouped/', { params })
    return data
  },
  printByUrl: async (url: string) => {
    const { data } = await apiClient.get(toApiPath(url), { responseType: 'blob' })
    return data as Blob
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
