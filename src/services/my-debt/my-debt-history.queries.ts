import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { myDebtHistoryService } from '@/services/my-debt/my-debt-history.service';
import type {
	MyDebtHistoryGroupedListParams,
	MyDebtHistoryListParams,
	MyDebtHistoryUpdatePayload,
} from '@/services/my-debt/my-debt-history.types';

const myDebtHistoryKeys = {
	all: ['my-debt-history'] as const,
	list: (params?: MyDebtHistoryListParams) => ['my-debt-history', 'list', params] as const,
	groupedList: (params?: MyDebtHistoryGroupedListParams) => ['my-debt-history', 'grouped-list', params] as const,
};

export function useMyDebtHistoryListQuery(params?: MyDebtHistoryListParams, enabled = true) {
	return useQuery({
		queryKey: myDebtHistoryKeys.list(params),
		queryFn: () => myDebtHistoryService.list(params),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function useMyDebtHistoryGroupedListQuery(params?: MyDebtHistoryGroupedListParams) {
	return useQuery({
		queryKey: myDebtHistoryKeys.groupedList(params),
		queryFn: () => myDebtHistoryService.listGrouped(params),
		placeholderData: (prev) => prev,
	});
}

function invalidateAfterDraftAction(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: myDebtHistoryKeys.all });
	queryClient.invalidateQueries({ queryKey: ['my-debts'] });
}

export function useUpdateMyDebtHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: MyDebtHistoryUpdatePayload }) =>
			myDebtHistoryService.update(id, payload),
		onSuccess: () => invalidateAfterDraftAction(queryClient),
	});
}

export function useDraftDeleteMyDebtHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => myDebtHistoryService.draftDelete(id),
		onSuccess: () => invalidateAfterDraftAction(queryClient),
	});
}

export function useHardDeleteMyDebtHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => myDebtHistoryService.hardDelete(id),
		onSuccess: () => invalidateAfterDraftAction(queryClient),
	});
}
