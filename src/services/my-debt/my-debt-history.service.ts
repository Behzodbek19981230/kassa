import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	MyDebtHistoryDraftDeleteResponse,
	MyDebtHistoryGroupedListParams,
	MyDebtHistoryGroupedResponse,
	MyDebtHistoryHardDeleteResponse,
	MyDebtHistoryItem,
	MyDebtHistoryListParams,
	MyDebtHistoryUpdatePayload,
} from '@/services/my-debt/my-debt-history.types';

export const myDebtHistoryService = {
	list: async (params?: MyDebtHistoryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<MyDebtHistoryItem>>('/my-total-debt-history/', { params });
		return data;
	},
	listGrouped: async (params?: MyDebtHistoryGroupedListParams) => {
		const { data } = await apiClient.get<MyDebtHistoryGroupedResponse>('/my-total-debt-history/groups/', {
			params,
		});
		return data;
	},
	update: async (id: number, payload: MyDebtHistoryUpdatePayload) => {
		const { data } = await apiClient.patch<MyDebtHistoryItem>(`/my-total-debt-history/${id}/`, payload);
		return data;
	},
	draftDelete: async (id: number) => {
		const { data } = await apiClient.delete<MyDebtHistoryDraftDeleteResponse>(
			`/my-total-debt-history/${id}/draft-delete/`,
		);
		return data;
	},
	hardDelete: async (id: number) => {
		const { data } = await apiClient.delete<MyDebtHistoryHardDeleteResponse>(
			`/my-total-debt-history/${id}/hard-delete/`,
		);
		return data;
	},
};
