import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  ProductCategory,
  ProductCategoryListParams,
  ProductCategoryPayload,
} from '@/services/product-category/product-category.types'

export const productCategoryService = {
  list: async (params?: ProductCategoryListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<ProductCategory>>('/product-category/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<ProductCategory>(`/product-category/${id}/`)
    return data
  },
  create: async (payload: ProductCategoryPayload) => {
    const { data } = await apiClient.post<ProductCategory>('/product-category/', payload)
    return data
  },
  update: async (id: number, payload: ProductCategoryPayload) => {
    const { data } = await apiClient.put<ProductCategory>(`/product-category/${id}/`, payload)
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/product-category/${id}/`)
  },
}
