import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productAccountHistoryService } from '@/services/product-account-history/product-account-history.service';
import type { ProductAccountHistoryUpdateCountPayload } from '@/services/product-account-history/product-account-history.types';

export function useUpdateProductCountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
			orderId,
		}: {
			id: number;
			payload: ProductAccountHistoryUpdateCountPayload;
			orderId?: number;
		}) => productAccountHistoryService.updateCount(id, payload, orderId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}
