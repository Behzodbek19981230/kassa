import type { ListParams } from '@/services/api/types'

export type ClientType = 'retail' | 'shop' | 'wholesale' | 'branch'

export const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'retail', label: 'Dona Mijoz' },
  { value: 'shop', label: "Do'kon Mijoz" },
  { value: 'wholesale', label: 'Optom Mijoz' },
  { value: 'branch', label: 'Filial Mijoz' },
]

export const CLIENT_PROFIT_LOSS_OPTIONS = [
  { value: '1', label: 'Hisoblansin' },
  { value: '0', label: 'Hisoblanmasin' },
]

export interface ClientCompanyDetail {
  id: number
  name: string
  logo: string | null
}

export interface ClientRegionDetail {
  id: number
  name: string
}

export interface ClientDistrictDetail {
  id: number
  code: string
  name: string
  region: number
  is_active: boolean
  region_detail?: ClientRegionDetail | null
}

export interface ClientUserDetail {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface Client {
  id: number
  fio: string
  phone: string
  address: string
  /** Decimal fields are serialized as strings by the API. */
  total_debt: string | null
  keshbek: string | null
  is_worker: number
  is_partner: number
  is_profit_loss: number
  type: ClientType
  company: number
  company_detail?: ClientCompanyDetail | null
  region: number
  region_detail?: ClientRegionDetail | null
  district: number
  district_detail?: ClientDistrictDetail | null
  worker_user: number | null
  worker_user_detail?: ClientUserDetail | null
  created_by?: number | null
  created_by_detail?: ClientUserDetail | null
  updated_by?: number | null
  updated_by_detail?: ClientUserDetail | null
  created_time?: string
  updated_time?: string
}

export interface ClientPayload {
  fio: string
  phone: string
  address: string
  total_debt: number
  keshbek: number
  is_worker: 0 | 1
  is_partner: 0 | 1
  is_profit_loss: 0 | 1
  type: ClientType
  company: number
  region: number
  district: number
  worker_user: number | null
}

export interface ClientListParams extends ListParams {
  type?: ClientType
  region?: number
  district?: number
  worker_user?: number
  created_by?: number
  is_profit_loss?: 0 | 1
}
