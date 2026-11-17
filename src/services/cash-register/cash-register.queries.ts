import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';
import type {
	CashClosingListParams,
	CashClosingPayload,
	CashMovementsParams,
} from '@/services/cash-register/cash-register.types';

export const cashRegisterKeys = {
	all: ['cash-register'] as const,
	current: () => ['cash-register', 'current'] as const,
	daily: (date?: string) => ['cash-register', 'daily', date ?? 'today'] as const,
	movements: (params: CashMovementsParams) => ['cash-register', 'movements', params] as const,
	closings: (params?: CashClosingListParams) => ['cash-register', 'closings', params] as const,
	closing: (id: number) => ['cash-register', 'closing', id] as const,
};

/** The kassa is always computed from the source records, so nothing here is kept as fresh. */
export function useCashRegisterCurrentQuery(enabled = true) {
	return useQuery({
		queryKey: cashRegisterKeys.current(),
		queryFn: cashRegisterService.current,
		enabled,
	});
}

export function useCashRegisterDailyQuery(date: string | undefined, enabled = true) {
	return useQuery({
		queryKey: cashRegisterKeys.daily(date),
		queryFn: () => cashRegisterService.daily(date),
		placeholderData: (prev) => prev,
		enabled,
	});
}

export function useCashMovementsQuery(params: CashMovementsParams, enabled = true) {
	return useQuery({
		queryKey: cashRegisterKeys.movements(params),
		queryFn: () => cashRegisterService.movements(params),
		placeholderData: (prev) => prev,
		enabled,
	});
}

export function useCashClosingListQuery(params?: CashClosingListParams, enabled = true) {
	return useQuery({
		queryKey: cashRegisterKeys.closings(params),
		queryFn: () => cashRegisterService.closingList(params),
		placeholderData: (prev) => prev,
		enabled,
	});
}

export function useCashClosingQuery(id?: number) {
	return useQuery({
		queryKey: cashRegisterKeys.closing(id ?? 0),
		queryFn: () => cashRegisterService.closingDetail(id as number),
		enabled: typeof id === 'number' && id > 0,
	});
}

export function useCreateCashClosingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CashClosingPayload) => cashRegisterService.createClosing(payload),
		onSuccess: (closing) => {
			queryClient.setQueryData(cashRegisterKeys.closing(closing.id), closing);
			queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all });
		},
	});
}

export function useCancelCashClosingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) => cashRegisterService.cancelClosing(id, reason),
		onSuccess: (closing) => {
			queryClient.setQueryData(cashRegisterKeys.closing(closing.id), closing);
			queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all });
		},
	});
}
