import { useQuery } from '@tanstack/react-query';
import { debtRepaymentDeleteHistoryService } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.service';
import type { DebtRepaymentDeleteHistoryListParams } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.types';

const debtRepaymentDeleteHistoryKeys = {
	list: (params?: DebtRepaymentDeleteHistoryListParams) => ['debt-repayment-delete-history', 'list', params] as const,
	detail: (id: number) => ['debt-repayment-delete-history', 'detail', id] as const,
};

export function useDebtRepaymentDeleteHistoryListQuery(params?: DebtRepaymentDeleteHistoryListParams) {
	return useQuery({
		queryKey: debtRepaymentDeleteHistoryKeys.list(params),
		queryFn: () => debtRepaymentDeleteHistoryService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useDebtRepaymentDeleteHistoryQuery(id?: number) {
	return useQuery({
		queryKey: debtRepaymentDeleteHistoryKeys.detail(id ?? 0),
		queryFn: () => debtRepaymentDeleteHistoryService.get(id as number),
		enabled: typeof id === 'number',
		// A 404 means the audit is gone; retrying won't bring it back.
		retry: false,
	});
}
