import type { ListParams } from '@/services/api/types'

export interface Role {
  id: number
  name: string
  key: string
}

export type RoleListParams = ListParams
