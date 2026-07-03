import type { ListParams } from '@/services/api/types'

export interface Company {
  id: number
  created_time: string
  updated_time: string
  name: string
  code: string
  logo: string | null
  phone: string
  region: number | null
  region_detail?: { id: number; name: string } | null
  district: number | null
  district_detail?: { id: number; name: string } | null
  address: string
  is_active: boolean
}

export interface CompanyPayload {
  name: string
  code: string
  phone: string
  region: number
  district: number
  address: string
  is_active: boolean
}

export type CompanyListParams = ListParams
