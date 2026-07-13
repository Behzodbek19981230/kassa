import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	VozvratCalculatePayload,
	VozvratCalculateResponse,
	VozvratConfirmPayload,
	VozvratConfirmResponse,
	VozvratOrderListItem,
	VozvratOrderListParams,
	VozvratOrderProductsResponse,
	VozvratProductsParams,
	VozvratProductsResponse,
} from '@/services/vozvrat/vozvrat.types';

export const vozvratService = {
	list: async (params?: VozvratOrderListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<VozvratOrderListItem>>('/vozvrat-order/', { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<VozvratOrderListItem>(`/vozvrat-order/${id}/`);
		return data;
	},
	getOrderProducts: async (id: number) => {
		const { data } = await apiClient.get<VozvratOrderProductsResponse>(`/vozvrat-order/${id}/products/`);
		return data;
	},
	getProducts: async (params: VozvratProductsParams) => {
		const { data } = await apiClient.get<VozvratProductsResponse>('/vozvrat-order/vozvrat/products/', { params });
		return data;
	},
	calculate: async (payload: VozvratCalculatePayload) => {
		const { data } = await apiClient.post<VozvratCalculateResponse>('/vozvrat-order/vozvrat/calculate/', payload);
		return data;
	},
	confirm: async (payload: VozvratConfirmPayload) => {
		const { data } = await apiClient.post<VozvratConfirmResponse>('/vozvrat-order/vozvrat/confirm/', payload);
		return data;
	},
};
