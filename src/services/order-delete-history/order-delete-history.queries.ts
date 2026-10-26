import { useQuery } from '@tanstack/react-query';
import { orderDeleteHistoryService } from '@/services/order-delete-history/order-delete-history.service';
import type { OrderDeleteHistoryListParams } from '@/services/order-delete-history/order-delete-history.types';

const orderDeleteHistoryKeys = {
	all: ['order-delete-history'] as const,
	list: (params?: OrderDeleteHistoryListParams) => ['order-delete-history', 'list', params] as const,
	detail: (id: number) => ['order-delete-history', 'detail', id] as const,
};

export function useOrderDeleteHistoryListQuery(params?: OrderDeleteHistoryListParams) {
	return useQuery({
		queryKey: orderDeleteHistoryKeys.list(params),
		queryFn: () => orderDeleteHistoryService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useOrderDeleteHistoryQuery(id?: number) {
	return useQuery({
		queryKey: orderDeleteHistoryKeys.detail(id ?? 0),
		queryFn: () => orderDeleteHistoryService.get(id as number),
		enabled: typeof id === 'number',
		// 404 means the audit expired (kept one month); retrying won't bring it back.
		retry: false,
	});
}
