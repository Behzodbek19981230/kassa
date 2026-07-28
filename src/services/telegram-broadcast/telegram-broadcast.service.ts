import { apiClient } from '@/services/api/client'
import type { PaginatedResponse } from '@/services/api/types'
import type {
  TelegramBroadcastCreateAllPayload,
  TelegramBroadcastCreatePayload,
  TelegramBroadcastCreateResponse,
  TelegramBroadcastDeleteResponse,
  TelegramBroadcastDeliveryRetryDeleteResponse,
  TelegramBroadcastDetailParams,
  TelegramBroadcastJob,
  TelegramBroadcastListParams,
  TelegramBroadcastRetryDeleteResponse,
} from '@/services/telegram-broadcast/telegram-broadcast.types'

function buildBroadcastFormData(payload: TelegramBroadcastCreateAllPayload & { client_ids?: number[] }) {
  const formData = new FormData()
  payload.client_ids?.forEach((id, index) => formData.append(`client_ids[${index}]`, String(id)))
  payload.warehouse_ids?.forEach((id, index) => formData.append(`warehouse_ids[${index}]`, String(id)))
  if (payload.text) formData.append('text', payload.text)
  if (payload.image) formData.append('image', payload.image)
  return formData
}

export const telegramBroadcastService = {
  list: async (params?: TelegramBroadcastListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<TelegramBroadcastJob>>('/telegram/warehouse-broadcast/', {
      params,
    })
    return data
  },
  get: async (id: number, params?: TelegramBroadcastDetailParams) => {
    const { data } = await apiClient.get<TelegramBroadcastJob>(`/telegram/warehouse-broadcast/${id}/`, { params })
    return data
  },
  create: async (payload: TelegramBroadcastCreatePayload) => {
    const { data } = await apiClient.post<TelegramBroadcastCreateResponse>(
      '/telegram/warehouse-broadcast/',
      buildBroadcastFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },
  /** Sends to every Telegram-connected client of the current company; backend resolves the list. */
  createAll: async (payload: TelegramBroadcastCreateAllPayload) => {
    const { data } = await apiClient.post<TelegramBroadcastCreateResponse>(
      '/telegram/warehouse-broadcast/all/',
      buildBroadcastFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },
  remove: async (id: number) => {
    const { data } = await apiClient.delete<TelegramBroadcastDeleteResponse>(`/telegram/warehouse-broadcast/${id}/`)
    return data
  },
  retryDelete: async (id: number) => {
    const { data } = await apiClient.post<TelegramBroadcastRetryDeleteResponse>(
      `/telegram/warehouse-broadcast/${id}/retry-delete/`,
    )
    return data
  },
  retryDeleteDelivery: async (deliveryId: number) => {
    const { data } = await apiClient.post<TelegramBroadcastDeliveryRetryDeleteResponse>(
      `/telegram/warehouse-broadcast-deliveries/${deliveryId}/retry-delete/`,
    )
    return data
  },
}
