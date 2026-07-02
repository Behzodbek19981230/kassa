import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service'
import type {
  BrandSizeTypeListParams,
  BrandSizeTypePayload,
} from '@/services/brand-size-type/brand-size-type.types'

const brandSizeTypeKeys = {
  all: ['brand-size-types'] as const,
  list: (params?: BrandSizeTypeListParams) => ['brand-size-types', 'list', params] as const,
}

export function useBrandSizeTypeListQuery(params?: BrandSizeTypeListParams) {
  return useQuery({
    queryKey: brandSizeTypeKeys.list(params),
    queryFn: () => brandSizeTypeService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateBrandSizeTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BrandSizeTypePayload) => brandSizeTypeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeTypeKeys.all }),
  })
}

export function useUpdateBrandSizeTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BrandSizeTypePayload }) =>
      brandSizeTypeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeTypeKeys.all }),
  })
}

export function useDeleteBrandSizeTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => brandSizeTypeService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeTypeKeys.all }),
  })
}
