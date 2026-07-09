import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehouseImageService } from '@/services/warehouse-image/warehouse-image.service'
import type { WarehouseImageListParams } from '@/services/warehouse-image/warehouse-image.types'

const warehouseImageKeys = {
  all: ['warehouse-image'] as const,
  list: (params?: WarehouseImageListParams) => ['warehouse-image', 'list', params] as const,
}

export function useWarehouseImageListQuery(params?: WarehouseImageListParams) {
  return useQuery({
    queryKey: warehouseImageKeys.list(params),
    queryFn: () => warehouseImageService.list(params),
    enabled: typeof params?.warehouse === 'number',
    placeholderData: (prev) => prev,
  })
}

export function useCreateWarehouseImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ warehouseId, image }: { warehouseId: number; image: File }) =>
      warehouseImageService.create(warehouseId, image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all }),
  })
}

export function useDeleteWarehouseImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehouseImageService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all }),
  })
}
