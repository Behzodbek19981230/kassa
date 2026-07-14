import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type { MyDebtHistoryItem, MyDebtHistoryListParams } from '@/services/my-debt/my-debt-history.types';

export const myDebtHistoryService = {
	list: async (params?: MyDebtHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<MyDebtHistoryItem>>('/my-total-debt-history/', { params });
		return data;
	},
};
