import { apiClient } from '@/services/api/client';
import type {
	ProductAccountHistoryCreatePayload,
	ProductAccountHistoryItem,
	ProductAccountHistoryUpdateCountPayload,
	ProductAccountHistoryUpdateCountResponse,
} from '@/services/product-account-history/product-account-history.types';

export const productAccountHistoryService = {
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
};
