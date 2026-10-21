import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	MyDebtItem,
	MyDebtListParams,
	MyDebtPayload,
	MyDebtPayPayload,
	MyDebtPayResponse,
	MyDebtYuanPaymentPayload,
	MyDebtYuanPaymentResponse,
} from '@/services/my-debt/my-debt.types';

export const myDebtService = {
	list: async (params?: MyDebtListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<MyDebtItem>>('/my-total-debt/', { params });
		return data;
	},
	/** Debts to China consignors, for the Logistics "Xitoy qarzim" page. */
	consignorDebts: async (params?: MyDebtListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<MyDebtItem>>('/my-total-debt/consignor-debts/', {
			params,
		});
		return data;
	},
	create: async (payload: MyDebtPayload) => {
		const { data } = await apiClient.post<MyDebtItem>('/my-total-debt/', payload);
		return data;
	},
	/** Debt to a consignor outside Uzbekistan (China side); `create` only accepts inside_uzbekistan ones. */
	createConsignorDebt: async (payload: MyDebtPayload) => {
		const { data } = await apiClient.post<MyDebtItem>('/my-total-debt/consignor-debts/', payload);
		return data;
	},
	delete: async (id: number) => {
		await apiClient.delete(`/my-total-debt/${id}/`);
	},
	pay: async (payload: MyDebtPayPayload) => {
		const { data } = await apiClient.post<MyDebtPayResponse>('/my-total-debt/pay/', payload);
		return data;
	},
	payInYuan: async (payload: MyDebtYuanPaymentPayload) => {
		const { data } = await apiClient.post<MyDebtYuanPaymentResponse>('/my-total-debt/payment/', payload);
		return data;
	},
};
