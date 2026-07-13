import { apiClient } from '@/services/api/client';
import type {
	VozvratCalculatePayload,
	VozvratCalculateResponse,
	VozvratConfirmPayload,
	VozvratConfirmResponse,
	VozvratProductsParams,
	VozvratProductsResponse,
} from '@/services/vozvrat/vozvrat.types';

export const vozvratService = {
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
