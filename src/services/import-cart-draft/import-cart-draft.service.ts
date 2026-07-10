import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ImportCartDraftItem,
	ImportCartDraftListParams,
	ImportCartDraftPayload,
} from '@/services/import-cart-draft/import-cart-draft.types';

export const importCartDraftService = {
	list: async (params?: ImportCartDraftListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<ImportCartDraftItem>>('/import-cart-draft/', {
			params,
		});
		return data;
	},
	create: async (payload: ImportCartDraftPayload) => {
		const { data } = await apiClient.post<ImportCartDraftItem>('/import-cart-draft/', payload);
		return data;
	},
	update: async (id: number, payload: ImportCartDraftPayload) => {
		const { data } = await apiClient.put<ImportCartDraftItem>(`/import-cart-draft/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/import-cart-draft/${id}/`);
	},
};
