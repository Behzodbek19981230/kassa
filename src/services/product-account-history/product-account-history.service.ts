import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ProductAccountHistoryCreatePayload,
	ProductAccountHistoryItem,
	ProductAccountHistoryLine,
	ProductAccountHistoryListParams,
	ProductAccountHistoryUpdateCountPayload,
	ProductAccountHistoryUpdateCountResponse,
} from '@/services/product-account-history/product-account-history.types';

export const productAccountHistoryService = {
	list: async (params?: ProductAccountHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<ProductAccountHistoryLine>>('/product-account-history/', {
			params,
		});
		return data;
	},
	updateCount: async (id: number, payload: ProductAccountHistoryUpdateCountPayload, orderId?: number) => {
		const { data } = await apiClient.patch<ProductAccountHistoryUpdateCountResponse>(
			`/product-account-history/${id}/update-count/`,
			payload,
			{ params: orderId ? { order_id: orderId } : undefined },
		);
		return data;
	},
	create: async (payload: ProductAccountHistoryCreatePayload) => {
		const { data } = await apiClient.post<ProductAccountHistoryItem>('/product-account-history/', payload);
		return data;
	},
	update: async (id: number, payload: ProductAccountHistoryCreatePayload) => {
		const { data } = await apiClient.put<ProductAccountHistoryItem>(`/product-account-history/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/product-account-history/${id}/`);
	},
};
