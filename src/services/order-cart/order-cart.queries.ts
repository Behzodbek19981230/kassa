import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderCartKeys.all }),
	});
}

export function useUpdateOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: OrderCartPayload }) =>
			orderCartService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderCartKeys.all }),
	});
}

export function useDeleteOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => orderCartService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderCartKeys.all }),
	});
}

export function useClearOrderCartMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ClearOrderCartPayload) => orderCartService.clear(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderCartKeys.all }),
	});
}

export function useConfirmSaleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ConfirmSalePayload) => orderCartService.confirmSale(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orderCartKeys.all });
			queryClient.invalidateQueries({ queryKey: ['clients'] });
		},
	});
}
