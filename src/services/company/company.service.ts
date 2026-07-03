import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { Company, CompanyListParams, CompanyPayload } from '@/services/company/company.types'

function buildCompanyFormData(payload: CompanyPayload, logo?: File | null) {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('code', payload.code)
  formData.append('phone', payload.phone)
  formData.append('region', String(payload.region))
  formData.append('district', String(payload.district))
  formData.append('address', payload.address)
  formData.append('is_active', String(payload.is_active))
  if (logo) formData.append('logo', logo)
  return formData
}

export const companyService = {
  list: async (params?: CompanyListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<Company>>('/company/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<Company>(`/company/${id}/`)
    return data
  },
  create: async (payload: CompanyPayload, logo?: File | null) => {
    const { data } = await apiClient.post<Company>('/company/', buildCompanyFormData(payload, logo), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  update: async (id: number, payload: CompanyPayload, logo?: File | null) => {
    const { data } = await apiClient.put<Company>(`/company/${id}/`, buildCompanyFormData(payload, logo), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/company/${id}/`)
  },
}
