import { apiClient } from '@/services/api/client';
import type { ListParams, PaginatedResponse } from '@/services/api/types';
import type {
	ValidateTransferItemPayload,
	ValidateTransferItemResponse,
	WarehouseTransfer,
	WarehouseTransferConfirmationPayload,
	WarehouseTransferCreatePayload,
	WarehouseTransferDetail,
	WarehouseTransferDispatchList,
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
	// Draft (karzinka): reserves the sender's stock until it is sent, edited or deleted (auto-removed after 1 hour).
	createDraft: async (payload: WarehouseTransferCreatePayload) => {
		const { data } = await apiClient.post<WarehouseTransferDetail>('/warehouse-transfer/drafts/', payload);
		return data;
	},
	listDrafts: async (params?: ListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<WarehouseTransfer>>('/warehouse-transfer/drafts/', {
			params,
		});
		return data;
	},
	getDraft: async (id: number) => {
		const { data } = await apiClient.get<WarehouseTransferDetail>(`/warehouse-transfer/drafts/${id}/`);
		return data;
	},
	updateDraft: async (id: number, payload: WarehouseTransferCreatePayload) => {
		const { data } = await apiClient.put<WarehouseTransferDetail>(`/warehouse-transfer/drafts/${id}/`, payload);
		return data;
	},
	deleteDraft: async (id: number) => {
		await apiClient.delete(`/warehouse-transfer/drafts/${id}/`);
	},
	sendDraft: async (id: number) => {
		const { data } = await apiClient.post<WarehouseTransferDetail>(`/warehouse-transfer/drafts/${id}/send/`, {});
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
	confirm: async (id: number, payload: WarehouseTransferConfirmationPayload) => {
		const { data } = await apiClient.post<WarehouseTransfer>(`/warehouse-transfer/${id}/confirmation/`, payload);
		return data;
	},
	print: async (id: number) => {
		const { data } = await apiClient.get(`/warehouse-transfer/${id}/print/`, { responseType: 'blob' });
		return data as Blob;
	},
	dispatchList: async (id: number) => {
		const { data } = await apiClient.get<WarehouseTransferDispatchList>(`/warehouse-transfer/${id}/dispatch-list/`);
		return data;
	},
	printDispatchList: async (id: number) => {
		const { data } = await apiClient.get(`/warehouse-transfer/${id}/dispatch-list/print/`, {
			responseType: 'blob',
		});
		return data as Blob;
	},
};
