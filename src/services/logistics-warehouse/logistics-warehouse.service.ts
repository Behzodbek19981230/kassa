import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	LogisticsWarehouse,
	LogisticsWarehouseListParams,
	LogisticsWarehousePayload,
} from '@/services/logistics-warehouse/logistics-warehouse.types';

const BASE_PATH = '/logistics-warehouse';

export const logisticsWarehouseService = {
	list: async (params?: LogisticsWarehouseListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<LogisticsWarehouse>>(`${BASE_PATH}/`, { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<LogisticsWarehouse>(`${BASE_PATH}/${id}/`);
		return data;
	},
	create: async (payload: LogisticsWarehousePayload) => {
		const { data } = await apiClient.post<LogisticsWarehouse>(`${BASE_PATH}/`, payload);
		return data;
	},
	update: async (id: number, payload: LogisticsWarehousePayload) => {
		const { data } = await apiClient.put<LogisticsWarehouse>(`${BASE_PATH}/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`${BASE_PATH}/${id}/`);
	},
};
