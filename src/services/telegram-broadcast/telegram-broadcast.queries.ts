import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { telegramBroadcastService } from '@/services/telegram-broadcast/telegram-broadcast.service'
import type {
  TelegramBroadcastCreatePayload,
  TelegramBroadcastDetailParams,
  TelegramBroadcastListParams,
} from '@/services/telegram-broadcast/telegram-broadcast.types'

const POLLING_STATUSES = new Set(['pending', 'processing', 'deleting'])

const telegramBroadcastKeys = {
  all: ['telegram-broadcast'] as const,
  list: (params?: TelegramBroadcastListParams) => ['telegram-broadcast', 'list', params] as const,
  detail: (id: number, params?: TelegramBroadcastDetailParams) =>
    ['telegram-broadcast', 'detail', id, params] as const,
}

export function useTelegramBroadcastListQuery(params?: TelegramBroadcastListParams) {
  return useQuery({
    queryKey: telegramBroadcastKeys.list(params),
    queryFn: () => telegramBroadcastService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useTelegramBroadcastQuery(id?: number, params?: TelegramBroadcastDetailParams) {
  return useQuery({
    queryKey: telegramBroadcastKeys.detail(id ?? 0, params),
    queryFn: () => telegramBroadcastService.get(id as number, params),
    enabled: typeof id === 'number',
    refetchInterval: (query) => (query.state.data && POLLING_STATUSES.has(query.state.data.status) ? 3000 : false),
  })
}

export function useCreateTelegramBroadcastMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TelegramBroadcastCreatePayload) => telegramBroadcastService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramBroadcastKeys.all }),
  })
}

export function useDeleteTelegramBroadcastMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => telegramBroadcastService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramBroadcastKeys.all }),
  })
}

export function useRetryDeleteTelegramBroadcastMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => telegramBroadcastService.retryDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramBroadcastKeys.all }),
  })
}

export function useRetryDeleteTelegramBroadcastDeliveryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deliveryId: number) => telegramBroadcastService.retryDeleteDelivery(deliveryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramBroadcastKeys.all }),
  })
}
