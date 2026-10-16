import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { yuanExchangeRateService } from '@/services/yuan-exchange-rate/yuan-exchange-rate.service';
import type { YuanExchangeRatePayload } from '@/services/yuan-exchange-rate/yuan-exchange-rate.types';

const yuanExchangeRateKeys = {
	all: ['yuan-exchange-rate'] as const,
	current: (company: number | null) => ['yuan-exchange-rate', 'current', company] as const,
};

export function useYuanExchangeRateQuery(company: number | null) {
	return useQuery({
		queryKey: yuanExchangeRateKeys.current(company),
		queryFn: async () => {
			const data = await yuanExchangeRateService.list({ company: company!, limit: 1 });
			return data.results[0] ?? null;
		},
		enabled: company != null,
		staleTime: Infinity,
	});
}

export function useSaveYuanExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id?: number; payload: YuanExchangeRatePayload }) =>
			id ? yuanExchangeRateService.update(id, payload) : yuanExchangeRateService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: yuanExchangeRateKeys.all });
			queryClient.invalidateQueries({ queryKey: ['yuan-exchange-rate-history'] });
		},
	});
}
