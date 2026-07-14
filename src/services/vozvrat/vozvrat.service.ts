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
	VozvratOrderUpdatePayload,
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
	printForClient: async (id: number) => {
		const { data } = await apiClient.get(`/vozvrat-order/${id}/print-for-client/`, { responseType: 'blob' });
		return data as Blob;
	},
	printForAdmin: async (id: number) => {
		const { data } = await apiClient.get(`/vozvrat-order/${id}/print/`, { responseType: 'blob' });
		return data as Blob;
	},
	update: async (id: number, payload: VozvratOrderUpdatePayload) => {
		const { data } = await apiClient.put<VozvratOrderListItem>(`/vozvrat-order/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/vozvrat-order/${id}/`);
	},
};
