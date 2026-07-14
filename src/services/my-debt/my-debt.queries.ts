import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { myDebtService } from '@/services/my-debt/my-debt.service';
import type { MyDebtListParams, MyDebtPayload } from '@/services/my-debt/my-debt.types';

const myDebtKeys = {
	all: ['my-debts'] as const,
	list: (params?: MyDebtListParams) => ['my-debts', 'list', params] as const,
};

export function useMyDebtListQuery(params?: MyDebtListParams) {
	return useQuery({
		queryKey: myDebtKeys.list(params),
		queryFn: () => myDebtService.list(params),
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
