import { apiClient } from '@/services/api/client';
import type {
	DebtRepaymentDeleteHistoryDetail,
	DebtRepaymentDeleteHistoryListParams,
	DebtRepaymentDeleteHistoryListResponse,
} from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.types';

export const debtRepaymentDeleteHistoryService = {
	list: async (params?: DebtRepaymentDeleteHistoryListParams) => {
		const { data } = await apiClient.get<DebtRepaymentDeleteHistoryListResponse>(
			'/debt-repayment-delete-history/',
			{ params },
		);
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<DebtRepaymentDeleteHistoryDetail>(`/debt-repayment-delete-history/${id}/`);
		return data;
	},
};
