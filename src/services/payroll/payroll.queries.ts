import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payroll/payroll.service';
import type {
	PayrollSummaryParams,
	PayrollSummaryResponse,
	PayrollTransactionListParams,
	PayrollTransactionPayload,
	SalaryRateUpdatePayload,
	UserSalaryHistoryListParams,
} from '@/services/payroll/payroll.types';

export const payrollKeys = {
	all: ['payroll'] as const,
	summary: (params: PayrollSummaryParams) => ['payroll', 'summary', params] as const,
	transactions: (params: PayrollTransactionListParams) => ['payroll', 'transactions', params] as const,
	salaryHistory: (params: UserSalaryHistoryListParams) => ['payroll', 'salary-history', params] as const,
};

export function usePayrollSummaryQuery(params: PayrollSummaryParams, enabled = true) {
	return useQuery({
		queryKey: payrollKeys.summary(params),
		queryFn: () => payrollService.summary(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function usePayrollTransactionListQuery(params: PayrollTransactionListParams, enabled = true) {
	return useQuery({
		queryKey: payrollKeys.transactions(params),
		queryFn: () => payrollService.listTransactions(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function useUserSalaryHistoryQuery(params: UserSalaryHistoryListParams, enabled = true) {
	return useQuery({
		queryKey: payrollKeys.salaryHistory(params),
		queryFn: () => payrollService.listSalaryHistory(params),
		enabled,
	});
}

export function useCreatePayrollTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: PayrollTransactionPayload) => payrollService.createTransaction(payload),
		onSuccess: (data, payload) => {
			const key = payrollKeys.summary({ user: payload.user, year: payload.year, month: payload.month });
			// The backend's summary is final: show it right away, then refetch the full one
			// (active_months and any totals the POST response left out).
			if (data.summary) {
				queryClient.setQueryData<PayrollSummaryResponse>(key, (prev) =>
					prev ? { ...prev, summary: { ...prev.summary, ...data.summary } } : prev,
				);
			}
			queryClient.invalidateQueries({ queryKey: ['payroll', 'summary'] });
			queryClient.invalidateQueries({ queryKey: ['payroll', 'transactions'] });
		},
	});
}

export function useDeletePayrollTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => payrollService.deleteTransaction(id),
		// Totals, active months and the list all change; the backend recomputes them.
		onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.all }),
	});
}

export function useUpdateSalaryRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: SalaryRateUpdatePayload) => payrollService.updateRate(payload),
		onSuccess: (_data, payload) => {
			queryClient.invalidateQueries({ queryKey: payrollKeys.all });
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['users', 'detail', payload.user] });
		},
	});
}
