import { apiClient } from '@/services/api/client';
import type {
	SoldDatesParams,
	SoldDatesResponse,
	SoldDayDebtsResponse,
	SoldDayOrdersResponse,
	SoldDayParams,
	SoldProductsDayParams,
	SoldProductsDayResponse,
	SoldProductsParams,
	SoldProductsResponse,
} from '@/services/sold-history/sold-history.types';

const SOLD_DATES = '/order-account-history/sold-dates';
const SOLD_PRODUCTS = '/order-account-history/sold-products';

export const soldHistoryService = {
	listDates: async (params?: SoldDatesParams) => {
		const { data } = await apiClient.get<SoldDatesResponse>(`${SOLD_DATES}/`, { params });
		return data;
	},
	dayOrders: async (date: string, params?: SoldDayParams) => {
		const { data } = await apiClient.get<SoldDayOrdersResponse>(`${SOLD_DATES}/${date}/orders/`, { params });
		return data;
	},
	dayDebts: async (date: string, params?: SoldDayParams) => {
		const { data } = await apiClient.get<SoldDayDebtsResponse>(`${SOLD_DATES}/${date}/debts/`, { params });
		return data;
	},
	soldProducts: async (params: SoldProductsParams) => {
		const { data } = await apiClient.get<SoldProductsResponse>(`${SOLD_PRODUCTS}/`, { params });
		return data;
	},
	soldProductsDay: async (date: string, params: SoldProductsDayParams) => {
		const { data } = await apiClient.get<SoldProductsDayResponse>(`${SOLD_PRODUCTS}/${date}/`, { params });
		return data;
	},
	printOrder: async (id: number) => {
		const { data } = await apiClient.get(`/order-account-history/${id}/print/`, { responseType: 'blob' });
		return data as Blob;
	},
	printDebt: async (id: number) => {
		const { data } = await apiClient.get(`/debt-repayment/${id}/print-debt/`, { responseType: 'blob' });
		return data as Blob;
	},
};
