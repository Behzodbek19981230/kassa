import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	UserColumn,
	UserColumnListParams,
	UserColumnPayload,
} from '@/services/user-columns/user-columns.types';

export const userColumnsService = {
	list: async (params?: UserColumnListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<UserColumn>>('/user-columns/', { params });
		return data;
	},
	create: async (payload: UserColumnPayload) => {
		const { data } = await apiClient.post<UserColumn>('/user-columns/', payload);
		return data;
	},
	update: async (id: number, payload: UserColumnPayload) => {
		const { data } = await apiClient.put<UserColumn>(`/user-columns/${id}/`, payload);
		return data;
	},
};
