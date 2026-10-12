import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	YuanExchangeRateHistoryItem,
	YuanExchangeRateHistoryListParams,
} from '@/services/yuan-exchange-rate-history/yuan-exchange-rate-history.types';

export const yuanExchangeRateHistoryService = {
	list: async (params?: YuanExchangeRateHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<YuanExchangeRateHistoryItem>>(
			'/yuan-exchange-rate-history/',
			{ params },
		);
		return data;
	},
};
