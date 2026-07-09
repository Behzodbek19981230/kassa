import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	OrderCartItem,
	OrderCartListParams,
	OrderCartPayload,
} from '@/services/order-cart/order-cart.types';

export const orderCartService = {
	list: async (params?: OrderCartListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<OrderCartItem>>('/order-account-cart-draft/', {
			params,
		});
		return data;
	},
	create: async (payload: OrderCartPayload) => {
		const { data } = await apiClient.post<OrderCartItem>('/order-account-cart-draft/', payload);
		return data;
	},
	update: async (id: number, payload: OrderCartPayload) => {
		const { data } = await apiClient.put<OrderCartItem>(`/order-account-cart-draft/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/order-account-cart-draft/${id}/`);
	},
};
