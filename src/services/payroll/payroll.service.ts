import { apiClient } from '@/services/api/client';
import type {
	PayrollDashboardParams,
	PayrollDashboardResponse,
	PayrollListResponse,
	SalaryAdjustment,
	SalaryAdjustmentListParams,
	SalaryAdjustmentPayload,
	SalaryAdjustmentResponse,
	SalaryPayment,
	SalaryPaymentListParams,
	SalaryPaymentPayload,
	SalaryPaymentResponse,
	SalaryPeriod,
	SalaryPeriodListParams,
	SalaryRateUpdatePayload,
	UserSalaryHistory,
	UserSalaryHistoryListParams,
} from '@/services/payroll/payroll.types';

export const payrollService = {
	dashboard: async (params: PayrollDashboardParams) => {
		const { data } = await apiClient.get<PayrollDashboardResponse>('/payroll/dashboard/', { params });
		return data;
	},
	updateRate: async (payload: SalaryRateUpdatePayload) => {
		const { data } = await apiClient.post<unknown>('/payroll/rate/update/', payload);
		return data;
	},

	getPeriod: async (id: number) => {
		const { data } = await apiClient.get<SalaryPeriod>(`/salary-period/${id}/`);
		return data;
	},
	listPeriods: async (params: SalaryPeriodListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<SalaryPeriod> | SalaryPeriod[]>('/salary-period/', {
			params,
		});
		return Array.isArray(data) ? data : data.results;
	},

	listPayments: async (params: SalaryPaymentListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<SalaryPayment>>('/salary-payment/', { params });
		return data;
	},
	createPayment: async (payload: SalaryPaymentPayload) => {
		const { data } = await apiClient.post<SalaryPaymentResponse>('/salary-payment/', payload);
		return data;
	},

	listAdjustments: async (params: SalaryAdjustmentListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<SalaryAdjustment>>('/salary-adjustment/', { params });
		return data;
	},
	createAdjustment: async (payload: SalaryAdjustmentPayload) => {
		const { data } = await apiClient.post<SalaryAdjustmentResponse>('/salary-adjustment/', payload);
		return data;
	},

	listSalaryHistory: async (params: UserSalaryHistoryListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<UserSalaryHistory>>('/user-salary-history/', {
			params,
		});
		return data;
	},
};
