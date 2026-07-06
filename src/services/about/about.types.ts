import type { ListParams } from '@/services/api/types'

export interface About {
  id: number
  nomer_nakladnoy: string
  postavshik: string
  phone: string
  dostavshik: string
  t_p: string
  company: number
}

export interface AboutPayload {
  nomer_nakladnoy: string
  postavshik: string
  phone: string
  dostavshik: string
  t_p: string
  company: number
}

export type AboutListParams = ListParams
