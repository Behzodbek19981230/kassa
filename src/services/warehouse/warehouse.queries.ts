import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from '@/services/warehouse/warehouse.service'
import type { WarehouseAllListParams, WarehouseListParams, WarehousePayload } from '@/services/warehouse/warehouse.types'

const warehouseKeys = {
  all: ['warehouse'] as const,
  list: (params?: WarehouseListParams) => ['warehouse', 'list', params] as const,
  allList: (params?: WarehouseAllListParams) => ['warehouse', 'all-list', params] as const,
  detail: (id: number) => ['warehouse', 'detail', id] as const,
}

export function useWarehouseListQuery(params?: WarehouseListParams, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehouseService.list(params),
    placeholderData: (prev) => prev,
    enabled,
  })
}

export function useWarehouseAllListQuery(params?: WarehouseAllListParams, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.allList(params),
    queryFn: () => warehouseService.allList(params),
    placeholderData: (prev) => prev,
    enabled,
  })
}

export function useWarehouseQuery(id?: number) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? 0),
    queryFn: () => warehouseService.get(id as number),
    enabled: typeof id === 'number',
  })
}

export function useCreateWarehouseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WarehousePayload) => warehouseService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  })
}

export function useUpdateWarehouseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WarehousePayload }) => warehouseService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  })
}

export function useDeleteWarehouseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehouseService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  })
}
