import { useQuery } from '@tanstack/react-query';
import { myDebtHistoryService } from '@/services/my-debt/my-debt-history.service';
import type {
	MyDebtHistoryGroupedListParams,
	MyDebtHistoryListParams,
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
