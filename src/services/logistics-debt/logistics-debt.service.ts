import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	LogisticsDebtHistoryItem,
	LogisticsDebtHistoryListParams,
	LogisticsDebtItem,
	LogisticsDebtListParams,
	LogisticsDebtYuanPaymentPayload,
	LogisticsDebtYuanPaymentResponse,
} from '@/services/logistics-debt/logistics-debt.types';

// Logistics debts grow through route-order dispatch / edit / confirm; they are paid down via payment/.
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
	payInYuan: async (payload: LogisticsDebtYuanPaymentPayload) => {
		const { data } = await apiClient.post<LogisticsDebtYuanPaymentResponse>('/logistics-debt/payment/', payload);
		return data;
	},
};
