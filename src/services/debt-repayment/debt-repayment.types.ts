import type { ListParams } from '@/services/api/types'

export interface DebtRepaymentCompanyDetail {
  id: number
  name: string
  logo: string | null
}

export interface DebtRepaymentClientDetail {
  id: number
  created_time: string
  updated_time: string
  fio: string
  phone: string
  address: string
  total_debt: string | null
  keshbek: string | null
  is_worker: number
  is_partner: number
  is_profit_loss: number
  type: string
  created_by: number
  updated_by: number | null
  company: number
  region: number
  district: number
  worker_user: number | null
}

export interface DebtRepaymentUserDetail {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface DebtRepayment {
  id: number
  company: number
  company_detail?: DebtRepaymentCompanyDetail | null
  client: number
  client_detail?: DebtRepaymentClientDetail | null
  created_by?: number | null
  created_by_detail?: DebtRepaymentUserDetail | null
  updated_by?: number | null
  updated_by_detail?: DebtRepaymentUserDetail | null
  created_time?: string
  updated_time?: string
  /** Decimal fields are serialized as strings by the API. */
  summa: string
  text: string
  date: string
  sum_som: string
  summ_dollar: string
  summ_cart: string
  sum_transfers: string
  total_debt: string
  exchange_rate: string
  discount_amount: string
  all_summ_dollar: string
  total_debt_old: string
  is_delete: number
  cr_date_time: string | null
  is_worker: number | null
  zdacha_sum: string
  zdacha_dollar: string
}

export interface DebtRepaymentPayload {
  summa: number
  text: string
  date: string
  sum_som: number
  summ_dollar: number
  summ_cart: number
  sum_transfers: number
  total_debt: number
  exchange_rate: number
  discount_amount: number
  all_summ_dollar: number
  total_debt_old: number
  is_delete: 0 | 1
  is_worker: number | null
  zdacha_sum: number
  zdacha_dollar: number
  company: number
  client: number
}

export interface DebtRepaymentListParams extends ListParams {
  company_id?: number
  client?: number
  is_worker?: number
}
