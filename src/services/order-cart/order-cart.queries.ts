import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderCartService } from '@/services/order-cart/order-cart.service';
import type {
	ClearOrderCartPayload,
	ConfirmSalePayload,
	OrderCartGroupedListParams,
	OrderCartListParams,
	OrderCartPayload,
} from '@/services/order-cart/order-cart.types';

const orderCartKeys = {
	all: ['order-cart'] as const,
	list: (params?: OrderCartListParams) => ['order-cart', 'list', params] as const,
	groupedList: (params?: OrderCartGroupedListParams) => ['order-cart', 'grouped-list', params] as const,
};

// Cart changes reserve/release stock, so the warehouse and per-sklad product counts change too.
function invalidateCartAndStock(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: orderCartKeys.all });
	queryClient.invalidateQueries({ queryKey: ['warehouse'] });
	queryClient.invalidateQueries({ queryKey: ['sklad-products'] });
}

export function useOrderCartListQuery(params?: OrderCartListParams, enabled = true) {
	return useQuery({
		queryKey: orderCartKeys.list(params),
		queryFn: () => orderCartService.list(params),
		enabled,
	});
}

export function useOrderCartGroupedListQuery(params?: OrderCartGroupedListParams, enabled = true) {
	return useQuery({
		queryKey: orderCartKeys.groupedList(params),
		queryFn: () => orderCartService.listGrouped(params),
		enabled,
	});
}

export function useCreateOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: OrderCartPayload) => orderCartService.create(payload),
		onSuccess: () => {
			invalidateCartAndStock(queryClient);
		},
	});
}

export function useUpdateOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: OrderCartPayload }) =>
			orderCartService.update(id, payload),
		onSuccess: () => {
			invalidateCartAndStock(queryClient);
		},
	});
}

export function useDeleteOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => orderCartService.remove(id),
		onSuccess: () => {
			invalidateCartAndStock(queryClient);
		},
	});
}

export function useClearOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ClearOrderCartPayload) => orderCartService.clear(payload),
		onSuccess: () => {
			invalidateCartAndStock(queryClient);
		},
	});
}

export function useConfirmSaleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ConfirmSalePayload) => orderCartService.confirmSale(payload),
		onSuccess: () => {
			invalidateCartAndStock(queryClient);
			queryClient.invalidateQueries({ queryKey: ['clients'] });
		},
	});
}
