import { useQuery } from '@tanstack/react-query';
import { exchangeRateHistoryService } from '@/services/exchange-rate-history/exchange-rate-history.service';
import type { ExchangeRateHistoryListParams } from '@/services/exchange-rate-history/exchange-rate-history.types';

export function useExchangeRateHistoryListQuery(params?: ExchangeRateHistoryListParams, enabled = true) {
	return useQuery({
		queryKey: ['exchange-rate-history', 'list', params] as const,
		queryFn: () => exchangeRateHistoryService.list(params),
		enabled,
	});
}
