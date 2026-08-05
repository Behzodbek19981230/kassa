import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import type {
	ValidateTransferItemPayload,
	WarehouseTransferCreatePayload,
	WarehouseTransferListParams,
} from '@/services/warehouse-transfer/warehouse-transfer.types';

const warehouseTransferKeys = {
	all: ['warehouse-transfer'] as const,
	list: (params?: WarehouseTransferListParams) => ['warehouse-transfer', 'list', params] as const,
	detail: (id: number) => ['warehouse-transfer', 'detail', id] as const,
	dispatchList: (id: number) => ['warehouse-transfer', 'dispatch-list', id] as const,
};

export function useWarehouseTransferListQuery(params?: WarehouseTransferListParams) {
	return useQuery({
		queryKey: warehouseTransferKeys.list(params),
		queryFn: () => warehouseTransferService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useWarehouseTransferQuery(id?: number) {
	return useQuery({
		queryKey: warehouseTransferKeys.detail(id ?? 0),
		queryFn: () => warehouseTransferService.get(id as number),
		enabled: typeof id === 'number',
	});
}

export function useWarehouseTransferDispatchListQuery(id?: number) {
	return useQuery({
		queryKey: warehouseTransferKeys.dispatchList(id ?? 0),
		queryFn: () => warehouseTransferService.dispatchList(id as number),
		enabled: typeof id === 'number',
	});
}

export function useValidateTransferItemMutation() {
	return useMutation({
		mutationFn: (payload: ValidateTransferItemPayload) => warehouseTransferService.validateItem(payload),
	});
}

export function useCreateWarehouseTransferMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: WarehouseTransferCreatePayload) => warehouseTransferService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.all });
			queryClient.invalidateQueries({ queryKey: ['warehouse'] });
		},
	});
}

export function useReverseWarehouseTransferMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => warehouseTransferService.reverse(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.all });
			queryClient.invalidateQueries({ queryKey: ['warehouse'] });
		},
	});
}
