import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehouseImageService } from '@/services/warehouse-image/warehouse-image.service'
import type { WarehouseImageListParams, WarehouseImageNumberChange } from '@/services/warehouse-image/warehouse-image.types'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all })
    },
  })
}

export function useUpdateWarehouseImageNumbersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: WarehouseImageNumberChange[]) =>
      Promise.all(changes.map(({ id, number }) => warehouseImageService.update(id, { number }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all })
    },
  })
}

export function useSetMainWarehouseImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, previousMainId }: { id: number; previousMainId?: number }) => {
      // Unmark the old main image first, so only one image is main at a time.
      if (previousMainId !== undefined && previousMainId !== id) {
        await warehouseImageService.update(previousMainId, { is_main: false })
      }
      return warehouseImageService.update(id, { is_main: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all })
    },
  })
}

export function useDeleteWarehouseImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehouseImageService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseImageKeys.all })
    },
  })
}
