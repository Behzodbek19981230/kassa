import { useQuery } from '@tanstack/react-query';
import { clientDebtorService } from '@/services/client-debtor/client-debtor.service';
import type { ClientDebtorListParams } from '@/services/client-debtor/client-debtor.types';

const clientDebtorKeys = {
	all: ['client-debtors'] as const,
	list: (params?: ClientDebtorListParams) => ['client-debtors', 'list', params] as const,
};

export function useClientDebtorListQuery(params?: ClientDebtorListParams) {
	return useQuery({
		queryKey: clientDebtorKeys.list(params),
		queryFn: () => clientDebtorService.list(params),
		placeholderData: (prev) => prev,
	});
}
