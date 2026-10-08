import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	LogisticsCompany,
	LogisticsCompanyListParams,
	LogisticsCompanyPayload,
} from '@/services/logistics-company/logistics-company.types';

const BASE_PATH = '/logistics-company';

export const logisticsCompanyService = {
	list: async (params?: LogisticsCompanyListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<LogisticsCompany>>(`${BASE_PATH}/`, { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<LogisticsCompany>(`${BASE_PATH}/${id}/`);
		return data;
	},
	create: async (payload: LogisticsCompanyPayload) => {
		const { data } = await apiClient.post<LogisticsCompany>(`${BASE_PATH}/`, payload);
		return data;
	},
	update: async (id: number, payload: LogisticsCompanyPayload) => {
		const { data } = await apiClient.put<LogisticsCompany>(`${BASE_PATH}/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`${BASE_PATH}/${id}/`);
	},
};
