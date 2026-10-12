import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsDebtService } from '@/services/logistics-debt/logistics-debt.service';
import type {
	LogisticsDebtHistoryListParams,
	LogisticsDebtListParams,
	LogisticsDebtYuanPaymentPayload,
} from '@/services/logistics-debt/logistics-debt.types';

export function useLogisticsDebtListQuery(params?: LogisticsDebtListParams, enabled = true) {
	return useQuery({
		queryKey: ['logistics-debt', 'list', params] as const,
		queryFn: () => logisticsDebtService.list(params),
		enabled,
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

export function usePayLogisticsDebtInYuanMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: LogisticsDebtYuanPaymentPayload) => logisticsDebtService.payInYuan(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['logistics-debt'] });
		},
	});
}
