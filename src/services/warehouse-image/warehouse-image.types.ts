import type { ListParams } from '@/services/api/types'

export interface WarehouseImage {
  id: number
  image: string
  warehouse: number
  /** Position of the image in the product gallery, 1-based. Not listed in the guide; assumed from the backend request. */
  number?: number | null
  /** The product's main image. Assumed from the backend's `is_main` flag; the guide does not list it. */
  is_main?: boolean
}

export interface WarehouseImageListParams extends ListParams {
  warehouse?: number
}

export interface WarehouseImageNumberChange {
  id: number
  number: number
}
