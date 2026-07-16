import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type { User, UserListParams, UserPayload } from '@/services/user/user.types'

function buildUserFormData(payload: UserPayload, avatar?: File | null) {
  const formData = new FormData()
  formData.append('username', payload.username)
  formData.append('first_name', payload.first_name)
  formData.append('last_name', payload.last_name)
  formData.append('second_name', payload.second_name)
  formData.append('gender', payload.gender)
  formData.append('date_of_birthday', payload.date_of_birthday)
  formData.append('phone_number', payload.phone_number)
  formData.append('email', payload.email)
  formData.append('is_active', String(payload.is_active))
  formData.append('region', String(payload.region))
  formData.append('district', String(payload.district))
  formData.append('role', String(payload.role))
  if (payload.trade_company != null) formData.append('trade_company', String(payload.trade_company))
  if (payload.current_company != null) formData.append('current_company', String(payload.current_company))
  payload.companies.forEach((companyId) => formData.append('companies', String(companyId)))
  formData.append('address', payload.address)
  if (payload.password) formData.append('password', payload.password)
  if (avatar) formData.append('avatar', avatar)
  return formData
}

export const userService = {
  getMe: async () => {
    const { data } = await apiClient.get<User>('/user-info/')
    return data
  },
  list: async (params?: UserListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/user/', { params })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<User>(`/user/${id}/`)
    return data
  },
  create: async (payload: UserPayload, avatar?: File | null) => {
    const { data } = await apiClient.post<User>('/user/', buildUserFormData(payload, avatar), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  update: async (id: number, payload: UserPayload, avatar?: File | null) => {
    const { data } = await apiClient.put<User>(`/user/${id}/`, buildUserFormData(payload, avatar), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  remove: async (id: number) => {
    await apiClient.delete(`/user/${id}/`)
  },
}
