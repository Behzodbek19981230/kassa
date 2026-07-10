import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	OrderAccountHistoryItem,
	OrderAccountHistoryListParams,
} from '@/services/order-account-history/order-account-history.types';

export const orderAccountHistoryService = {
	list: async (params?: OrderAccountHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<OrderAccountHistoryItem>>('/order-account-history/', {
			params,
		});
		return data;
	},
};
