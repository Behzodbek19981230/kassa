import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aboutService } from '@/services/about/about.service'
import type { AboutListParams, AboutPayload } from '@/services/about/about.types'

const aboutKeys = {
  all: ['about'] as const,
  list: (params?: AboutListParams) => ['about', 'list', params] as const,
}

export function useAboutListQuery(params?: AboutListParams) {
  return useQuery({
    queryKey: aboutKeys.list(params),
    queryFn: () => aboutService.list(params),
    placeholderData: (prev) => prev,
    enabled: params?.company_id != null,
  })
}

export function useCreateAboutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AboutPayload) => aboutService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aboutKeys.all }),
  })
}

export function useUpdateAboutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AboutPayload }) => aboutService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aboutKeys.all }),
  })
}

export function useDeleteAboutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => aboutService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aboutKeys.all }),
  })
}
