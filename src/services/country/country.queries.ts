import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { countryService } from '@/services/country/country.service';
import type { CountryListParams, CountryPayload } from '@/services/country/country.types';

const countryKeys = {
	all: ['country'] as const,
	list: (params?: CountryListParams) => ['country', 'list', params] as const,
	detail: (id: number) => ['country', 'detail', id] as const,
};

export function useCountryListQuery(params?: CountryListParams) {
	return useQuery({
		queryKey: countryKeys.list(params),
		queryFn: () => countryService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useCountryQuery(id?: number) {
	return useQuery({
		queryKey: countryKeys.detail(id ?? 0),
		queryFn: () => countryService.get(id as number),
		enabled: typeof id === 'number',
	});
}

export function useCreateCountryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CountryPayload) => countryService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: countryKeys.all });
		},
	});
}

export function useUpdateCountryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: CountryPayload }) => countryService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: countryKeys.all });
		},
	});
}

export function useDeleteCountryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => countryService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: countryKeys.all });
		},
	});
}
