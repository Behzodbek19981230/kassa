import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';
import type {
	OrderAccountHistoryGroupedListParams,
	OrderAccountHistoryListParams,
	OrderAccountHistoryUpdatePayload,
	OrderAccountHistoryUpdateSalePayload,
	OrderAndDebtListParams,
} from '@/services/order-account-history/order-account-history.types';

const orderAccountHistoryKeys = {
	all: ['order-account-history'] as const,
	list: (params?: OrderAccountHistoryListParams) => ['order-account-history', 'list', params] as const,
	groupedList: (params?: OrderAccountHistoryGroupedListParams) =>
		['order-account-history', 'grouped-list', params] as const,
	detail: (id?: number) => ['order-account-history', 'detail', id] as const,
	detailProducts: (id?: number) => ['order-account-history', 'detail-products', id] as const,
	orderAndDebt: (params?: OrderAndDebtListParams) => ['order-account-history', 'order-and-debt', params] as const,
};

export function useOrderAccountHistoryListQuery(params?: OrderAccountHistoryListParams) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.list(params),
		queryFn: () => orderAccountHistoryService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useOrderAccountHistoryGroupedListQuery(params?: OrderAccountHistoryGroupedListParams) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.groupedList(params),
		queryFn: () => orderAccountHistoryService.listGrouped(params),
		placeholderData: (prev) => prev,
	});
}

export function useOrderAccountHistoryQuery(id?: number) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.detail(id),
		queryFn: () => orderAccountHistoryService.get(id!),
		enabled: id !== undefined,
	});
}

export function useOrderAccountHistoryProductsQuery(id?: number) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.detailProducts(id),
		queryFn: () => orderAccountHistoryService.getProducts(id!),
		enabled: id !== undefined,
	});
}

export function useOrderAndDebtListQuery(params?: OrderAndDebtListParams) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.orderAndDebt(params),
		queryFn: () => orderAccountHistoryService.listOrderAndDebt(params),
		placeholderData: (prev) => prev,
	});
}

export function useUpdateOrderAccountHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: OrderAccountHistoryUpdatePayload }) =>
			orderAccountHistoryService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderAccountHistoryKeys.all }),
	});
}

export function useUpdateSaleOrderAccountHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: OrderAccountHistoryUpdateSalePayload }) =>
			orderAccountHistoryService.updateSale(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orderAccountHistoryKeys.all }),
	});
}
