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
	get: async (id: number) => {
		const { data } = await apiClient.get<OrderAccountHistoryItem>(`/order-account-history/${id}/`);
		return data;
	},
	printForClient: async (id: number) => {
		const { data } = await apiClient.get(`/order-account-history/${id}/print/`, { responseType: 'blob' });
		return data as Blob;
	},
	printForWorker: async (id: number) => {
		const { data } = await apiClient.get(`/order-account-history/${id}/print-worker/`, { responseType: 'blob' });
		return data as Blob;
	},
};
