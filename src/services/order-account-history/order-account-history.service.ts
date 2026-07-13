import { apiClient, API_BASE_URL } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	OrderAccountHistoryGroupedListParams,
	OrderAccountHistoryGroupedResponse,
	OrderAccountHistoryItem,
	OrderAccountHistoryListParams,
	OrderAccountHistoryProductsResponse,
} from '@/services/order-account-history/order-account-history.types';

const API_PATH_PREFIX = new URL(API_BASE_URL).pathname.replace(/\/$/, '');

function toApiPath(url: string) {
	return url.startsWith(API_PATH_PREFIX) ? url.slice(API_PATH_PREFIX.length) : url;
}

export const orderAccountHistoryService = {
	list: async (params?: OrderAccountHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<OrderAccountHistoryItem>>('/order-account-history/', {
			params,
		});
		return data;
	},
	listGrouped: async (params?: OrderAccountHistoryGroupedListParams) => {
		const { data } = await apiClient.get<OrderAccountHistoryGroupedResponse>('/order-account-history/grouped/', {
			params,
		});
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<OrderAccountHistoryItem>(`/order-account-history/${id}/`);
		return data;
	},
	getProducts: async (id: number) => {
		const { data } = await apiClient.get<OrderAccountHistoryProductsResponse>(`/order-account-history/${id}/products/`);
		return data;
	},
	printByUrl: async (url: string) => {
		const { data } = await apiClient.get(toApiPath(url), { responseType: 'blob' });
		return data as Blob;
	},
};
