import { apiClient } from '@/services/api/client';
import type {
	OrderDeleteHistoryDetail,
	OrderDeleteHistoryListParams,
	OrderDeleteHistoryListResponse,
} from '@/services/order-delete-history/order-delete-history.types';

export const orderDeleteHistoryService = {
	list: async (params?: OrderDeleteHistoryListParams) => {
		const { data } = await apiClient.get<OrderDeleteHistoryListResponse>('/order-delete-history/', { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<OrderDeleteHistoryDetail>(`/order-delete-history/${id}/`);
		return data;
	},
};
