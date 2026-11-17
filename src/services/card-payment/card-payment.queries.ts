import { useQuery } from '@tanstack/react-query';
import { cardPaymentService } from '@/services/card-payment/card-payment.service';
import type { CardPaymentListParams, CardPaymentTotalsParams } from '@/services/card-payment/card-payment.types';

const cardPaymentKeys = {
	list: (params?: CardPaymentListParams) => ['card-payment', 'list', params] as const,
	totals: (params?: CardPaymentTotalsParams) => ['card-payment', 'totals', params] as const,
};

export function useCardPaymentListQuery(params?: CardPaymentListParams, enabled = true) {
	return useQuery({
		queryKey: cardPaymentKeys.list(params),
		queryFn: () => cardPaymentService.list(params),
		placeholderData: (prev) => prev,
		enabled,
	});
}

export function useCardPaymentTotalsQuery(params?: CardPaymentTotalsParams, enabled = true) {
	return useQuery({
		queryKey: cardPaymentKeys.totals(params),
		queryFn: () => cardPaymentService.totals(params),
		placeholderData: (prev) => prev,
		enabled,
	});
}
