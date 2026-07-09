import type { ListParams } from '@/services/api/types'

export interface SkladType {
  id: number
  name: string
}

export interface SkladTypePayload {
  name: string
}

export type SkladTypeListParams = ListParams
