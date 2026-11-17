import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentCardService } from '@/services/payment-card/payment-card.service';
import type { PaymentCardListParams, PaymentCardPayload } from '@/services/payment-card/payment-card.types';

const paymentCardKeys = {
	all: ['payment-card'] as const,
	list: (params?: PaymentCardListParams) => ['payment-card', 'list', params] as const,
	detail: (id: number) => ['payment-card', 'detail', id] as const,
};

export function usePaymentCardListQuery(params?: PaymentCardListParams) {
	return useQuery({
		queryKey: paymentCardKeys.list(params),
		queryFn: () => paymentCardService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function usePaymentCardQuery(id?: number) {
	return useQuery({
		queryKey: paymentCardKeys.detail(id ?? 0),
		queryFn: () => paymentCardService.get(id as number),
		enabled: typeof id === 'number' && id > 0,
	});
}

export function useCreatePaymentCardMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: PaymentCardPayload) => paymentCardService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: paymentCardKeys.all });
		},
	});
}

export function useUpdatePaymentCardMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: PaymentCardPayload }) =>
			paymentCardService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: paymentCardKeys.all });
		},
	});
}

export function useDeletePaymentCardMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => paymentCardService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: paymentCardKeys.all });
		},
	});
}
