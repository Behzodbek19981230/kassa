import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ExchangeRateHistoryItem,
	ExchangeRateHistoryListParams,
} from '@/services/exchange-rate-history/exchange-rate-history.types';

export const exchangeRateHistoryService = {
	list: async (params?: ExchangeRateHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<ExchangeRateHistoryItem>>('/exchange-rate-history/', {
			params,
		});
		return data;
	},
};
