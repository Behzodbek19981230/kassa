import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeRateService } from '@/services/exchange-rate/exchange-rate.service';
import type { ExchangeRatePayload } from '@/services/exchange-rate/exchange-rate.types';

const exchangeRateKeys = {
	all: ['exchange-rate'] as const,
	current: (company: number | null) => ['exchange-rate', 'current', company] as const,
};

export function useExchangeRateQuery(company: number | null) {
	return useQuery({
		queryKey: exchangeRateKeys.current(company),
		queryFn: async () => {
			const data = await exchangeRateService.list({ company: company!, limit: 1 });
			return data.results[0] ?? null;
		},
		enabled: company != null,
		refetchInterval: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
	});
}

export function useSaveExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id?: number; payload: ExchangeRatePayload }) =>
			id ? exchangeRateService.update(id, payload) : exchangeRateService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all }),
	});
}
