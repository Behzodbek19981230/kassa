import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { WarehouseImage, WarehouseImageListParams } from '@/services/warehouse-image/warehouse-image.types'

function buildWarehouseImageFormData(warehouseId: number, image: File) {
  const formData = new FormData()
  formData.append('warehouse', String(warehouseId))
  formData.append('image', image)
  return formData
}

export const warehouseImageService = {
  list: async (params?: WarehouseImageListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<WarehouseImage>>('/warehouse-image/', { params })
    return data
  },
  create: async (warehouseId: number, image: File) => {
    const { data } = await apiClient.post<WarehouseImage>(
      '/warehouse-image/',
      buildWarehouseImageFormData(warehouseId, image),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/warehouse-image/${id}/`)
  },
}
