import { useQuery } from '@tanstack/react-query';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';
import type {
	OrderAccountHistoryGroupedListParams,
	OrderAccountHistoryListParams,
} from '@/services/order-account-history/order-account-history.types';

const orderAccountHistoryKeys = {
	all: ['order-account-history'] as const,
	list: (params?: OrderAccountHistoryListParams) => ['order-account-history', 'list', params] as const,
	groupedList: (params?: OrderAccountHistoryGroupedListParams) =>
		['order-account-history', 'grouped-list', params] as const,
	detail: (id?: number) => ['order-account-history', 'detail', id] as const,
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
