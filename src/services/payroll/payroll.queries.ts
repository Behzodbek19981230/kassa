import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payroll/payroll.service';
import type {
	PayrollDashboardParams,
	SalaryAdjustmentListParams,
	SalaryAdjustmentPayload,
	SalaryPaymentListParams,
	SalaryPaymentPayload,
	SalaryPeriod,
	SalaryRateUpdatePayload,
	UserSalaryHistoryListParams,
} from '@/services/payroll/payroll.types';

interface PeriodLookup {
	user?: number;
	year: number;
	month: number;
}

export const payrollKeys = {
	all: ['payroll'] as const,
	dashboard: (params: PayrollDashboardParams) => ['payroll', 'dashboard', params] as const,
	periodLookup: (lookup: PeriodLookup) => ['payroll', 'period', 'lookup', lookup] as const,
	payments: (params: SalaryPaymentListParams) => ['payroll', 'payments', params] as const,
	adjustments: (params: SalaryAdjustmentListParams) => ['payroll', 'adjustments', params] as const,
	salaryHistory: (params: UserSalaryHistoryListParams) => ['payroll', 'salary-history', params] as const,
};

export function usePayrollDashboardQuery(params: PayrollDashboardParams) {
	return useQuery({
		queryKey: payrollKeys.dashboard(params),
		queryFn: () => payrollService.dashboard(params),
		placeholderData: (prev) => prev,
	});
}

/**
 * The salary period of one employee for one month, or `null` when the backend has not created it yet
 * (it does so on the first payment or adjustment of that month).
 */
export function useSalaryPeriodLookupQuery(lookup: PeriodLookup) {
	return useQuery({
		queryKey: payrollKeys.periodLookup(lookup),
		queryFn: async () => {
			const periods = await payrollService.listPeriods({
				user: lookup.user,
				year: lookup.year,
				month: lookup.month,
				limit: 1,
			});
			return (
				periods.find((p) => p.user === lookup.user && p.year === lookup.year && p.month === lookup.month) ?? null
			);
		},
		enabled: typeof lookup.user === 'number',
	});
}

export function useSalaryPaymentListQuery(params: SalaryPaymentListParams, enabled = true) {
	return useQuery({
		queryKey: payrollKeys.payments(params),
		queryFn: () => payrollService.listPayments(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function useSalaryAdjustmentListQuery(params: SalaryAdjustmentListParams, enabled = true) {
	return useQuery({
		queryKey: payrollKeys.adjustments(params),
		queryFn: () => payrollService.listAdjustments(params),
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

/** Stores the period the backend returned, then refetches everything else that depends on it. */
function applyPeriodFromResponse(queryClient: QueryClient, period: SalaryPeriod | undefined) {
	if (period) {
		queryClient.setQueryData(
			payrollKeys.periodLookup({ user: period.user, year: period.year, month: period.month }),
			period,
		);
	}
	queryClient.invalidateQueries({
		queryKey: payrollKeys.all,
		predicate: (query) => {
			const key = query.queryKey as unknown[];
			// The lookup set above is the backend's own answer; don't overwrite it with a refetch.
			return !(period && key[1] === 'period');
		},
	});
}

export function useCreateSalaryPaymentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: SalaryPaymentPayload) => payrollService.createPayment(payload),
		onSuccess: (data) => applyPeriodFromResponse(queryClient, data.salary_period),
	});
}

export function useCreateSalaryAdjustmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: SalaryAdjustmentPayload) => payrollService.createAdjustment(payload),
		onSuccess: (data) => applyPeriodFromResponse(queryClient, data.salary_period),
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
