import { apiClient } from '@/services/api/client';
import type {
	DashboardStatisticsParams,
	DashboardStatisticsResponse,
	DashboardUserStatisticsParams,
	DashboardUserStatisticsResponse,
} from '@/services/dashboard/dashboard.types';

export const dashboardService = {
	getStatistics: async (params?: DashboardStatisticsParams) => {
		const { data } = await apiClient.get<DashboardStatisticsResponse>('/reports/dashboard/statistics/', { params });
		return data;
	},
	getUserStatistics: async (params: DashboardUserStatisticsParams) => {
		const { data } = await apiClient.get<DashboardUserStatisticsResponse>('/reports/dashboard/user-statistics/', {
			params,
		});
		return data;
	},
};
