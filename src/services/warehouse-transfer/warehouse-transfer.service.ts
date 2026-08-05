import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	ValidateTransferItemPayload,
	ValidateTransferItemResponse,
	WarehouseTransfer,
	WarehouseTransferCreatePayload,
	WarehouseTransferDetail,
	WarehouseTransferListParams,
} from '@/services/warehouse-transfer/warehouse-transfer.types';

export const warehouseTransferService = {
	validateItem: async (payload: ValidateTransferItemPayload) => {
		const { data } = await apiClient.post<ValidateTransferItemResponse>(
			'/warehouse-transfer/validate-item/',
			payload,
		);
		return data;
	},
	create: async (payload: WarehouseTransferCreatePayload) => {
		const { data } = await apiClient.post<WarehouseTransferDetail>('/warehouse-transfer/', payload);
		return data;
	},
	list: async (params?: WarehouseTransferListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<WarehouseTransfer>>('/warehouse-transfer/', { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<WarehouseTransferDetail>(`/warehouse-transfer/${id}/`);
		return data;
	},
	reverse: async (id: number) => {
		const { data } = await apiClient.post<WarehouseTransferDetail>(`/warehouse-transfer/${id}/reverse/`);
		return data;
	},
	print: async (id: number) => {
		const { data } = await apiClient.get(`/warehouse-transfer/${id}/print/`, { responseType: 'blob' });
		return data as Blob;
	},
};
