import { useQuery } from '@tanstack/react-query';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';
import type { OrderAccountHistoryListParams } from '@/services/order-account-history/order-account-history.types';

const orderAccountHistoryKeys = {
	all: ['order-account-history'] as const,
	list: (params?: OrderAccountHistoryListParams) => ['order-account-history', 'list', params] as const,
};

export function useOrderAccountHistoryListQuery(params?: OrderAccountHistoryListParams) {
	return useQuery({
		queryKey: orderAccountHistoryKeys.list(params),
		queryFn: () => orderAccountHistoryService.list(params),
		placeholderData: (prev) => prev,
	});
}
