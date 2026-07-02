import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productCategoryService } from '@/services/product-category/product-category.service'
import type {
  ProductCategoryListParams,
  ProductCategoryPayload,
} from '@/services/product-category/product-category.types'

const productCategoryKeys = {
  all: ['product-categories'] as const,
  list: (params?: ProductCategoryListParams) => ['product-categories', 'list', params] as const,
}

export function useProductCategoryListQuery(params?: ProductCategoryListParams) {
  return useQuery({
    queryKey: productCategoryKeys.list(params),
    queryFn: () => productCategoryService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductCategoryPayload) => productCategoryService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
  })
}

export function useUpdateProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductCategoryPayload }) =>
      productCategoryService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
  })
}

export function useDeleteProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productCategoryService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
  })
}
