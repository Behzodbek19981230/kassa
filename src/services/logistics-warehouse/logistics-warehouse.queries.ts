import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsWarehouseService } from '@/services/logistics-warehouse/logistics-warehouse.service';
import type {
	LogisticsWarehouseListParams,
	LogisticsWarehousePayload,
} from '@/services/logistics-warehouse/logistics-warehouse.types';

const logisticsWarehouseKeys = {
	all: ['logistics-warehouse'] as const,
	list: (params?: LogisticsWarehouseListParams) => ['logistics-warehouse', 'list', params] as const,
	detail: (id: number) => ['logistics-warehouse', 'detail', id] as const,
};

export function useLogisticsWarehouseListQuery(params?: LogisticsWarehouseListParams, enabled = true) {
	return useQuery({
		queryKey: logisticsWarehouseKeys.list(params),
		queryFn: () => logisticsWarehouseService.list(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function useLogisticsWarehouseQuery(id?: number) {
	return useQuery({
		queryKey: logisticsWarehouseKeys.detail(id ?? 0),
		queryFn: () => logisticsWarehouseService.get(id as number),
		enabled: typeof id === 'number',
	});
}

export function useCreateLogisticsWarehouseMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: LogisticsWarehousePayload) => logisticsWarehouseService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: logisticsWarehouseKeys.all });
		},
	});
}

export function useUpdateLogisticsWarehouseMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: LogisticsWarehousePayload }) =>
			logisticsWarehouseService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: logisticsWarehouseKeys.all });
		},
	});
}

export function useDeleteLogisticsWarehouseMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => logisticsWarehouseService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: logisticsWarehouseKeys.all });
		},
	});
}
