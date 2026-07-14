import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type { MyDebtItem, MyDebtListParams, MyDebtPayload } from '@/services/my-debt/my-debt.types';

export const myDebtService = {
	list: async (params?: MyDebtListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<MyDebtItem>>('/my-total-debt/', { params });
		return data;
	},
	create: async (payload: MyDebtPayload) => {
		const { data } = await apiClient.post<MyDebtItem>('/my-total-debt/', payload);
		return data;
	},
};
