import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  EmployeePayload,
  User,
  UserListParams,
  UserPayload,
  UserPayrollSummary,
  UserTelegramBotRegisterPayload,
} from '@/services/user/user.types'

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

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
  formData.append('region', String(payload.region))
  formData.append('district', String(payload.district))
  formData.append('role', String(payload.role))
  // Multipart has no null: an empty value clears the type.
  if (payload.type !== undefined) formData.append('type', payload.type === null ? '' : String(payload.type))
  if (payload.trade_company != null) formData.append('trade_company', String(payload.trade_company))
  if (payload.current_company != null) formData.append('current_company', String(payload.current_company))
  payload.companies.forEach((companyId) => formData.append('companies', String(companyId)))
  payload.type_sklads?.forEach((typeSkladId) => formData.append('type_sklads', String(typeSkladId)))
  formData.append('address', payload.address)
  if (payload.password) formData.append('password', payload.password)
  if (payload.oylik_dollar != null) formData.append('oylik_dollar', payload.oylik_dollar)
  if (payload.oylik_som != null) formData.append('oylik_som', payload.oylik_som)
  if (avatar) formData.append('avatar', avatar)
  return formData
}

function buildEmployeeFormData(payload: Partial<EmployeePayload>, avatar?: File | null) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return
    // Multipart has no null: an empty value clears an optional field (region, district, birthday...).
    formData.append(key, value === null ? '' : String(value))
  })
  if (avatar) formData.append('avatar', avatar)
  return formData
}

export const userService = {
  getMe: async () => {
    const { data } = await apiClient.get<User>('/user-info/')
    return data
  },
  list: async (params?: UserListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<User> & { payroll_summary?: UserPayrollSummary }>('/user/', {
      params,
    })
    return data
  },
  get: async (id: number) => {
    const { data } = await apiClient.get<User>(`/user/${id}/`)
    return data
  },
  create: async (payload: UserPayload, avatar?: File | null) => {
    const { data } = await apiClient.post<User>('/user/', buildUserFormData(payload, avatar), MULTIPART)
    return data
  },
  /** Full update (PUT) of a system user: a missing `type_sklads` list clears it, so it is always sent. */
  update: async (id: number, payload: UserPayload, avatar?: File | null) => {
    const { data } = await apiClient.put<User>(`/user/${id}/`, buildUserFormData(payload, avatar), MULTIPART)
    return data
  },
  createEmployee: async (payload: EmployeePayload, avatar?: File | null) => {
    const { data } = await apiClient.post<User>('/user/', buildEmployeeFormData(payload, avatar), MULTIPART)
    return data
  },
  updateEmployee: async (id: number, payload: Partial<EmployeePayload>, avatar?: File | null) => {
    const { data } = await apiClient.patch<User>(`/user/${id}/`, buildEmployeeFormData(payload, avatar), MULTIPART)
    return data
  },
  /** Moves the user to the archive (Tab 4); a system user's session is closed and they can no longer log in. */
  archive: async (id: number) => {
    const { data } = await apiClient.post<User>(`/user/${id}/archive/`)
    return data
  },
  /** Super Admin: brings an archived user back to their tab. */
  restore: async (id: number) => {
    const { data } = await apiClient.post<User>(`/user/${id}/restore/`)
    return data
  },
  /** Super Admin, archived users only. 409 when the user has payroll payments (they stay in the archive). */
  remove: async (id: number) => {
    await apiClient.delete(`/user/${id}/`)
  },
  unblock: async (id: number) => {
    const { data } = await apiClient.patch<User>(`/user/${id}/`, { is_login_blocked: false })
    return data
  },
  registerTelegramBot: async (id: number, payload: UserTelegramBotRegisterPayload) => {
    const { data } = await apiClient.patch<User>(`/user/${id}/`, payload)
    return data
  },
}
