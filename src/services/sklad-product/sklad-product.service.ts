import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	SkladProduct,
	SkladProductListParams,
	SkladProductPayload,
} from '@/services/sklad-product/sklad-product.types';

export const skladProductService = {
	list: async (params?: SkladProductListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<SkladProduct>>('/sklad-product/', { params });
		return data;
	},
	// A product has at most one stock row per sklad, so this returns that row or null.
	findByPair: async (warehouse: number, typeSklad: number) => {
		const { data } = await apiClient.get<PaginatedResponse<SkladProduct>>('/sklad-product/', {
			params: { warehouse, type_sklad: typeSklad, limit: 1 },
		});
		return data.results[0] ?? null;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<SkladProduct>(`/sklad-product/${id}/`);
		return data;
	},
	create: async (payload: SkladProductPayload) => {
		const { data } = await apiClient.post<SkladProduct>('/sklad-product/', payload);
		return data;
	},
	update: async (id: number, payload: Partial<SkladProductPayload>) => {
		const { data } = await apiClient.patch<SkladProduct>(`/sklad-product/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`/sklad-product/${id}/`);
	},
};
