import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { myDebtService } from '@/services/my-debt/my-debt.service';
import type { MyDebtListParams, MyDebtPayload, MyDebtPayPayload } from '@/services/my-debt/my-debt.types';

const myDebtKeys = {
	all: ['my-debts'] as const,
	list: (params?: MyDebtListParams) => ['my-debts', 'list', params] as const,
};

export function useMyDebtListQuery(params?: MyDebtListParams, enabled = true) {
	return useQuery({
		queryKey: myDebtKeys.list(params),
		queryFn: () => myDebtService.list(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function useCreateMyDebtMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: MyDebtPayload) => myDebtService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: myDebtKeys.all }),
	});
}

export function usePayMyDebtMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: MyDebtPayPayload) => myDebtService.pay(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: myDebtKeys.all });
			queryClient.invalidateQueries({ queryKey: ['my-debt-history'] });
		},
	});
}
