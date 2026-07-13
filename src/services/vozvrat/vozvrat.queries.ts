import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vozvratService } from '@/services/vozvrat/vozvrat.service';
import type {
	VozvratCalculatePayload,
	VozvratConfirmPayload,
	VozvratProductsParams,
} from '@/services/vozvrat/vozvrat.types';

export function useVozvratProductsQuery(params: VozvratProductsParams | undefined) {
	return useQuery({
		queryKey: ['vozvrat', 'products', params],
		queryFn: () => vozvratService.getProducts(params!),
		enabled: Boolean(params?.client_id),
		placeholderData: (prev) => prev,
	});
}

export function useVozvratCalculateMutation() {
	return useMutation({
		mutationFn: (payload: VozvratCalculatePayload) => vozvratService.calculate(payload),
	});
}

export function useVozvratConfirmMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: VozvratConfirmPayload) => vozvratService.confirm(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['vozvrat'] });
			queryClient.invalidateQueries({ queryKey: ['clients'] });
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}
