import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type { SkladItem, SkladListParams } from '@/services/sklad/sklad.types';

export const skladService = {
	list: async (params?: SkladListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<SkladItem>>('/sklad/', { params });
		return data;
	},
};
