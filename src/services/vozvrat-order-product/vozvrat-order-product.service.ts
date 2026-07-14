import { apiClient } from '@/services/api/client';
import type {
	VozvratOrderProductCreatePayload,
	VozvratOrderProductItem,
} from '@/services/vozvrat-order-product/vozvrat-order-product.types';

export const vozvratOrderProductService = {
	create: async (payload: VozvratOrderProductCreatePayload) => {
		const { data } = await apiClient.post<VozvratOrderProductItem>('/vozvrat-order-product/', payload);
		return data;
	},
	update: async (id: number, payload: VozvratOrderProductCreatePayload) => {
		const { data } = await apiClient.put<VozvratOrderProductItem>(`/vozvrat-order-product/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/vozvrat-order-product/${id}/`);
	},
};
