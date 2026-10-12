import { useQuery } from '@tanstack/react-query';
import { yuanExchangeRateHistoryService } from '@/services/yuan-exchange-rate-history/yuan-exchange-rate-history.service';
import type { YuanExchangeRateHistoryListParams } from '@/services/yuan-exchange-rate-history/yuan-exchange-rate-history.types';

export function useYuanExchangeRateHistoryListQuery(params?: YuanExchangeRateHistoryListParams, enabled = true) {
	return useQuery({
		queryKey: ['yuan-exchange-rate-history', 'list', params] as const,
		queryFn: () => yuanExchangeRateHistoryService.list(params),
		enabled,
	});
}
