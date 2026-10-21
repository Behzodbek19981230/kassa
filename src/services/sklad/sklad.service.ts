import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	SkladDetail,
	SkladEditPayload,
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
	get: async (id: number) => {
		const { data } = await apiClient.get<SkladDetail>(`/sklad/${id}/`);
		return data;
	},
	edit: async (id: number, payload: SkladEditPayload) => {
		const { data } = await apiClient.patch<SkladDetail>(`/sklad/${id}/`, payload);
		return data;
	},
	getView: async (id: number, params?: SkladViewParams) => {
		const { data } = await apiClient.get<SkladViewResponse>(`/sklad/${id}/sklad-view/`, { params });
		return data;
	},
	printView: async (id: number) => {
		const { data } = await apiClient.get(`/sklad/${id}/sklad-view/print/`, { responseType: 'blob' });
		return data as Blob;
	},
	update: async (id: number, payload: SkladUpdatePayload) => {
		const { data } = await apiClient.put<SkladItem>(`/sklad/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/sklad/${id}/`, { data: { sklad: 'Sklad' } });
	},
};
