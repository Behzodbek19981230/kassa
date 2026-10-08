import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type { Country, CountryListParams, CountryPayload } from '@/services/country/country.types';

const BASE_PATH = '/country';

export const countryService = {
	list: async (params?: CountryListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<Country>>(`${BASE_PATH}/`, { params });
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<Country>(`${BASE_PATH}/${id}/`);
		return data;
	},
	create: async (payload: CountryPayload) => {
		const { data } = await apiClient.post<Country>(`${BASE_PATH}/`, payload);
		return data;
	},
	update: async (id: number, payload: CountryPayload) => {
		const { data } = await apiClient.put<Country>(`${BASE_PATH}/${id}/`, payload);
		return data;
	},
	remove: async (id: number) => {
		await apiClient.delete(`${BASE_PATH}/${id}/`);
	},
};
