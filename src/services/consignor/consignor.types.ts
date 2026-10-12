import type { ListParams } from '@/services/api/types'

export type ConsignorType = 'outside_uzbekistan' | 'inside_uzbekistan'

export const CONSIGNOR_TYPE_OPTIONS: { value: ConsignorType; label: string }[] = [
  { value: 'outside_uzbekistan', label: "O'zbekistondan tashqarida" },
  { value: 'inside_uzbekistan', label: "O'zbekiston ichida" },
]

export interface Consignor {
  id: number
  created_time: string
  updated_time: string
  name: string
  phone: string
  address: string
  type: ConsignorType
}

export interface ConsignorPayload {
  name: string
  phone: string
  address: string
  type: ConsignorType
}

export interface ConsignorListParams extends ListParams {
  type?: ConsignorType
}
