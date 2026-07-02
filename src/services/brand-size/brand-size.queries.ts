import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brandSizeService } from '@/services/brand-size/brand-size.service'
import type { BrandSizeListParams, BrandSizePayload } from '@/services/brand-size/brand-size.types'

const brandSizeKeys = {
  all: ['brand-sizes'] as const,
  list: (params?: BrandSizeListParams) => ['brand-sizes', 'list', params] as const,
}

export function useBrandSizeListQuery(params?: BrandSizeListParams) {
  return useQuery({
    queryKey: brandSizeKeys.list(params),
    queryFn: () => brandSizeService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateBrandSizeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BrandSizePayload) => brandSizeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeKeys.all }),
  })
}

export function useUpdateBrandSizeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BrandSizePayload }) =>
      brandSizeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeKeys.all }),
  })
}

export function useDeleteBrandSizeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => brandSizeService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandSizeKeys.all }),
  })
}
