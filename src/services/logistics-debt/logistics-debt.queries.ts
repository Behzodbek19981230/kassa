import { useQuery } from '@tanstack/react-query';
import { logisticsDebtService } from '@/services/logistics-debt/logistics-debt.service';
import type {
	LogisticsDebtHistoryListParams,
	LogisticsDebtListParams,
} from '@/services/logistics-debt/logistics-debt.types';

export function useLogisticsDebtListQuery(params?: LogisticsDebtListParams) {
	return useQuery({
		queryKey: ['logistics-debt', 'list', params] as const,
		queryFn: () => logisticsDebtService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useLogisticsDebtHistoryQuery(params?: LogisticsDebtHistoryListParams) {
	return useQuery({
		queryKey: ['logistics-debt', 'history', params] as const,
		queryFn: () => logisticsDebtService.history(params),
		placeholderData: (prev) => prev,
	});
}
