import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	YuanExchangeRateItem,
	YuanExchangeRateListParams,
	YuanExchangeRatePayload,
} from '@/services/yuan-exchange-rate/yuan-exchange-rate.types';

export const yuanExchangeRateService = {
	list: async (params?: YuanExchangeRateListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<YuanExchangeRateItem>>('/yuan-exchange-rate/', {
			params,
		});
		return data;
	},
	create: async (payload: YuanExchangeRatePayload) => {
		const { data } = await apiClient.post<YuanExchangeRateItem>('/yuan-exchange-rate/', payload);
		return data;
	},
	update: async (id: number, payload: YuanExchangeRatePayload) => {
		const { data } = await apiClient.put<YuanExchangeRateItem>(`/yuan-exchange-rate/${id}/`, payload);
		return data;
	},
};
