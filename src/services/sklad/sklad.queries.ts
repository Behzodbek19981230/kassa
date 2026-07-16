import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skladService } from '@/services/sklad/sklad.service';
import type { SkladListParams, SkladUpdatePayload, SkladViewParams } from '@/services/sklad/sklad.types';

const skladKeys = {
	all: ['sklad'] as const,
	list: (params?: SkladListParams) => ['sklad', 'list', params] as const,
	view: (id?: number, params?: SkladViewParams) => ['sklad', 'view', id, params] as const,
};

export function useSkladListQuery(params?: SkladListParams) {
	return useQuery({
		queryKey: skladKeys.list(params),
		queryFn: () => skladService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useSkladViewQuery(id?: number, params?: SkladViewParams) {
	return useQuery({
		queryKey: skladKeys.view(id, params),
		queryFn: () => skladService.getView(id!, params),
		enabled: id !== undefined,
	});
}

export function useUpdateSkladMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: SkladUpdatePayload }) => skladService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: skladKeys.all }),
	});
}
