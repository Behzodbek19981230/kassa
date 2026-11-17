import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	PaymentCard,
	PaymentCardListParams,
	PaymentCardPayload,
} from '@/services/payment-card/payment-card.types';

const BASE_PATH = '/payment-card';

export const paymentCardService = {
	list: async (params?: PaymentCardListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<PaymentCard>>(`${BASE_PATH}/`, { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<PaymentCard>(`${BASE_PATH}/${id}/`);
		return data;
	},
	create: async (payload: PaymentCardPayload) => {
		const { data } = await apiClient.post<PaymentCard>(`${BASE_PATH}/`, payload);
		return data;
	},
	update: async (id: number, payload: PaymentCardPayload) => {
		const { data } = await apiClient.put<PaymentCard>(`${BASE_PATH}/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`${BASE_PATH}/${id}/`);
	},
};
