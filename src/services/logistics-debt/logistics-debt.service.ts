import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	LogisticsDebtHistoryItem,
	LogisticsDebtHistoryListParams,
	LogisticsDebtItem,
	LogisticsDebtListParams,
} from '@/services/logistics-debt/logistics-debt.types';

// Read-only: logistics debts change through route-order dispatch / edit / confirm, not directly.
export const logisticsDebtService = {
	list: async (params?: LogisticsDebtListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<LogisticsDebtItem>>('/logistics-debt/', { params });
		return data;
	},
	history: async (params?: LogisticsDebtHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<LogisticsDebtHistoryItem>>('/logistics-debt-history/', {
			params,
		});
		return data;
	},
};
