import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ExchangeRateItem,
	ExchangeRateListParams,
	ExchangeRatePayload,
} from '@/services/exchange-rate/exchange-rate.types';

export const exchangeRateService = {
	list: async (params?: ExchangeRateListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<ExchangeRateItem>>('/exchange-rate/', { params });
		return data;
	},
	create: async (payload: ExchangeRatePayload) => {
		const { data } = await apiClient.post<ExchangeRateItem>('/exchange-rate/', payload);
		return data;
	},
	update: async (id: number, payload: ExchangeRatePayload) => {
		const { data } = await apiClient.put<ExchangeRateItem>(`/exchange-rate/${id}/`, payload);
		return data;
	},
};
