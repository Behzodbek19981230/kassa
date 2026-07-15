import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/client/client.service'
import type { ClientListParams, ClientPayload } from '@/services/client/client.types'

const clientKeys = {
  all: ['clients'] as const,
  list: (params?: ClientListParams) => ['clients', 'list', params] as const,
  detail: (id: number) => ['clients', 'detail', id] as const,
}

export function useClientListQuery(params?: ClientListParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientService.list(params),
    placeholderData: (prev) => prev,
    enabled: params?.company_id != null,
  })
}

export function useClientQuery(id?: number) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? 0),
    queryFn: () => clientService.get(id as number),
    enabled: typeof id === 'number',
  })
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientPayload }) => clientService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}
