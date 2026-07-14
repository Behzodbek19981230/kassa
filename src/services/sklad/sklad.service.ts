import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	SkladItem,
	SkladListParams,
	SkladUpdatePayload,
	SkladViewParams,
	SkladViewResponse,
} from '@/services/sklad/sklad.types';

export const skladService = {
	list: async (params?: SkladListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<SkladItem>>('/sklad/', { params });
		return data;
	},
	getView: async (id: number, params?: SkladViewParams) => {
		const { data } = await apiClient.get<SkladViewResponse>(`/sklad/${id}/sklad-view/`, { params });
		return data;
	},
	update: async (id: number, payload: SkladUpdatePayload) => {
		const { data } = await apiClient.put<SkladItem>(`/sklad/${id}/`, payload);
		return data;
	},
};
