import { apiClient } from '@/services/api/client';
import type {
	PayrollListResponse,
	PayrollSummaryParams,
	PayrollSummaryResponse,
	PayrollTransaction,
	PayrollTransactionCreateResponse,
	PayrollTransactionListParams,
	PayrollTransactionPayload,
	SalaryRateUpdatePayload,
	UserSalaryHistory,
	UserSalaryHistoryListParams,
} from '@/services/payroll/payroll.types';

export const payrollService = {
	summary: async (params: PayrollSummaryParams) => {
		const { data } = await apiClient.get<PayrollSummaryResponse>('/payroll/summary/', { params });
		return data;
	},

	listTransactions: async (params: PayrollTransactionListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<PayrollTransaction>>('/payroll-transaction/', {
			params,
		});
		return data;
	},
	createTransaction: async (payload: PayrollTransactionPayload) => {
		const { data } = await apiClient.post<PayrollTransactionCreateResponse>('/payroll-transaction/', payload);
		return data;
	},

	updateRate: async (payload: SalaryRateUpdatePayload) => {
		const { data } = await apiClient.post<unknown>('/payroll/rate/update/', payload);
		return data;
	},
	listSalaryHistory: async (params: UserSalaryHistoryListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<UserSalaryHistory>>('/user-salary-history/', {
			params,
		});
		return data;
	},
};
