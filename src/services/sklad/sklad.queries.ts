import { useQuery } from '@tanstack/react-query';
import { skladService } from '@/services/sklad/sklad.service';
import type { SkladListParams } from '@/services/sklad/sklad.types';

const skladKeys = {
	all: ['sklad'] as const,
	list: (params?: SkladListParams) => ['sklad', 'list', params] as const,
};

export function useSkladListQuery(params?: SkladListParams) {
	return useQuery({
		queryKey: skladKeys.list(params),
		queryFn: () => skladService.list(params),
		placeholderData: (prev) => prev,
	});
}
