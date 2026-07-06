import type { ListParams } from '@/services/api/types'

export interface ExpenseType {
  id: number
  name: string
}

export interface ExpenseTypePayload {
  name: string
}

export type ExpenseTypeListParams = ListParams
