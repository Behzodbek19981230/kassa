import { apiClient } from '@/services/api/client';
import type {
	ClientDebtorFilterParams,
	ClientDebtorListParams,
	ClientDebtorListResponse,
} from '@/services/client-debtor/client-debtor.types';

export const clientDebtorService = {
	list: async (params?: ClientDebtorListParams) => {
		const { data } = await apiClient.get<ClientDebtorListResponse>('/client/debtors/', { params });
		return data;
	},
	pdf: async (params?: ClientDebtorFilterParams) => {
		const { data } = await apiClient.get('/client/debtors/pdf/', { params, responseType: 'blob' });
		return data as Blob;
	},
};
