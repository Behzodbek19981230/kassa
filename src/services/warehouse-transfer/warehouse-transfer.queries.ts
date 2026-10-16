import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import type {
	ValidateTransferItemPayload,
	WarehouseTransferConfirmationPayload,
	WarehouseTransferCreatePayload,
	WarehouseTransferListParams,
} from '@/services/warehouse-transfer/warehouse-transfer.types';

const warehouseTransferKeys = {
	all: ['warehouse-transfer'] as const,
	drafts: ['warehouse-transfer', 'drafts'] as const,
	list: (params?: WarehouseTransferListParams) => ['warehouse-transfer', 'list', params] as const,
	detail: (id: number) => ['warehouse-transfer', 'detail', id] as const,
	dispatchList: (id: number) => ['warehouse-transfer', 'dispatch-list', id] as const,
};

export function useWarehouseTransferListQuery(
	params?: WarehouseTransferListParams,
	options?: Partial<UseQueryOptions<Awaited<ReturnType<typeof warehouseTransferService.list>>>>,
) {
	return useQuery({
		queryKey: warehouseTransferKeys.list(params),
		queryFn: () => warehouseTransferService.list(params),
		placeholderData: (prev) => prev,
		...options,
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

export function useWarehouseTransferDraftListQuery(enabled = true) {
	return useQuery({
		queryKey: warehouseTransferKeys.drafts,
		queryFn: () => warehouseTransferService.listDrafts({ page: 1, limit: 50 }),
		enabled,
	});
}

function useInvalidateDrafts() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.all });
		// Drafts reserve (and release) sender stock, so the stock lists change with them.
		queryClient.invalidateQueries({ queryKey: ['warehouse'] });
	};
}

export function useCreateWarehouseTransferDraftMutation() {
	const invalidate = useInvalidateDrafts();
	return useMutation({
		mutationFn: (payload: WarehouseTransferCreatePayload) => warehouseTransferService.createDraft(payload),
		onSuccess: invalidate,
	});
}

export function useUpdateWarehouseTransferDraftMutation() {
	const invalidate = useInvalidateDrafts();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: WarehouseTransferCreatePayload }) =>
			warehouseTransferService.updateDraft(id, payload),
		onSuccess: invalidate,
	});
}

export function useDeleteWarehouseTransferDraftMutation() {
	const invalidate = useInvalidateDrafts();
	return useMutation({
		mutationFn: (id: number) => warehouseTransferService.deleteDraft(id),
		onSuccess: invalidate,
	});
}

export function useSendWarehouseTransferDraftMutation() {
	const invalidate = useInvalidateDrafts();
	return useMutation({
		mutationFn: (id: number) => warehouseTransferService.sendDraft(id),
		onSuccess: invalidate,
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

export function useConfirmWarehouseTransferMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: WarehouseTransferConfirmationPayload }) =>
			warehouseTransferService.confirm(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.all });
		},
	});
}
