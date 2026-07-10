import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ClearImportCartPayload,
	ClearImportCartResponse,
	ConfirmImportPayload,
	ConfirmImportResponse,
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
	clear: async (payload: ClearImportCartPayload) => {
		const { data } = await apiClient.delete<ClearImportCartResponse>('/import-cart-draft/clear/', {
			data: payload,
		});
		return data;
	},
	confirmImport: async (payload: ConfirmImportPayload) => {
		const { data } = await apiClient.post<ConfirmImportResponse>(
			'/import-cart-draft/confirm-import/',
			payload,
		);
		return data;
	},
};
