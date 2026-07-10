import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ClearOrderCartPayload,
	ClearOrderCartResponse,
	ConfirmSalePayload,
	ConfirmSaleResponse,
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
	clear: async (payload: ClearOrderCartPayload) => {
		const { data } = await apiClient.delete<ClearOrderCartResponse>('/order-account-cart-draft/clear/', {
			data: payload,
		});
		return data;
	},
	confirmSale: async (payload: ConfirmSalePayload) => {
		const { data } = await apiClient.post<ConfirmSaleResponse>('/order-account-history/confirm-sale/', payload);
		return data;
	},
};
