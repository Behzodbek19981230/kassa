import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	CompanyEventLogItem,
	CompanyEventLogListParams,
} from '@/services/company-event-log/company-event-log.types';

export const companyEventLogService = {
	list: async (params?: CompanyEventLogListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<CompanyEventLogItem>>('/company-event-log/', {
			params,
		});
		return data;
	},
	get: async (id: number) => {
		const { data } = await apiClient.get<CompanyEventLogItem>(`/company-event-log/${id}/`);
		return data;
	},
};
