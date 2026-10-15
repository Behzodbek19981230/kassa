import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productAccountHistoryService } from '@/services/product-account-history/product-account-history.service';
import type {
	ProductAccountHistoryCreatePayload,
	ProductAccountHistoryListParams,
	ProductAccountHistoryUpdateCountPayload,
} from '@/services/product-account-history/product-account-history.types';

// The sold lines of one order, with the sklad each was sold from.
export function useProductAccountHistoryListQuery(params: ProductAccountHistoryListParams, enabled = true) {
	return useQuery({
		queryKey: ['order-account-history', 'product-lines', params] as const,
		queryFn: () => productAccountHistoryService.list(params),
		enabled,
	});
}

export function useUpdateProductCountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
			orderId,
		}: {
			id: number;
			payload: ProductAccountHistoryUpdateCountPayload;
			orderId?: number;
		}) => productAccountHistoryService.updateCount(id, payload, orderId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}

export function useCreateProductAccountHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ProductAccountHistoryCreatePayload) => productAccountHistoryService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}

export function useUpdateProductAccountHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: ProductAccountHistoryCreatePayload }) =>
			productAccountHistoryService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}

export function useDeleteProductAccountHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => productAccountHistoryService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}
