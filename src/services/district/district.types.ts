import type { ListParams } from '@/services/api/types'

export interface District {
  id: number
  code: string
  name: string
  region: number
  is_active: boolean
}

export interface DistrictPayload {
  code: string
  name: string
  region: number
  is_active: boolean
}

export interface DistrictListParams extends ListParams {
  region?: number
}
