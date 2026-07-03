import type { ListParams } from '@/services/api/types'

export interface Region {
  id: number
  name: string
}

export interface RegionPayload {
  name: string
}

export type RegionListParams = ListParams
