import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard/dashboard.service';
import type {
	DashboardStatisticsParams,
	DashboardUserStatisticsParams,
} from '@/services/dashboard/dashboard.types';

const dashboardKeys = {
	statistics: (params?: DashboardStatisticsParams) => ['dashboard', 'statistics', params] as const,
	userStatistics: (params?: DashboardUserStatisticsParams) => ['dashboard', 'user-statistics', params] as const,
};

export function useDashboardStatisticsQuery(params?: DashboardStatisticsParams) {
	return useQuery({
		queryKey: dashboardKeys.statistics(params),
		queryFn: () => dashboardService.getStatistics(params),
		placeholderData: (prev) => prev,
	});
}

export function useDashboardUserStatisticsQuery(params: DashboardUserStatisticsParams) {
	return useQuery({
		queryKey: dashboardKeys.userStatistics(params),
		queryFn: () => dashboardService.getUserStatistics(params),
		placeholderData: (prev) => prev,
	});
}
