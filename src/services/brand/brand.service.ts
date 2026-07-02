import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Brand, BrandListParams, BrandNextSorting, BrandPayload } from '@/services/brand/brand.types'

export const brandService = {
  list: async (params?: BrandListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Brand>>('/brand/', { params })
    return data
  },
  getNextSorting: async () => {
    const { data } = await apiClient.get<BrandNextSorting>('/brand/sorting/')
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Brand>(`/brand/${id}/`)
    return data
  },
  create: async (payload: BrandPayload) => {
    const { data } = await apiClient.post<Brand>('/brand/', payload)
    return data
  },
  update: async (id: number, payload: BrandPayload) => {
    const { data } = await apiClient.put<Brand>(`/brand/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/brand/${id}/`)
  },
}
