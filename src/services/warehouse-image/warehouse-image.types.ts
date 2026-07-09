import type { ListParams } from '@/services/api/types'

export interface WarehouseImage {
  id: number
  image: string
  warehouse: number
}

export interface WarehouseImageListParams extends ListParams {
  warehouse?: number
}
