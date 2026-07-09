import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { skladTypeService } from '@/services/sklad-type/sklad-type.service'
import type { SkladTypeListParams, SkladTypePayload } from '@/services/sklad-type/sklad-type.types'

const skladTypeKeys = {
  all: ['sklad-types'] as const,
  list: (params?: SkladTypeListParams) => ['sklad-types', 'list', params] as const,
}

export function useSkladTypeListQuery(params?: SkladTypeListParams) {
  return useQuery({
    queryKey: skladTypeKeys.list(params),
    queryFn: () => skladTypeService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateSkladTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SkladTypePayload) => skladTypeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skladTypeKeys.all }),
  })
}

export function useUpdateSkladTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SkladTypePayload }) => skladTypeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skladTypeKeys.all }),
  })
}

export function useDeleteSkladTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => skladTypeService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skladTypeKeys.all }),
  })
}
