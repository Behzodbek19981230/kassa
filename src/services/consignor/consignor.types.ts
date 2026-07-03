import type { ListParams } from '@/services/api/types'

export interface Consignor {
  id: number
  created_time: string
  updated_time: string
  name: string
  phone: string
  address: string
}

export interface ConsignorPayload {
  name: string
  phone: string
  address: string
}

export type ConsignorListParams = ListParams
