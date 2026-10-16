import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skladService } from '@/services/sklad/sklad.service';
import type { SkladEditPayload, SkladListParams, SkladUpdatePayload, SkladViewParams } from '@/services/sklad/sklad.types';

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

export function useSkladDetailQuery(id?: number) {
	return useQuery({
		queryKey: [...skladKeys.all, 'detail', id] as const,
		queryFn: () => skladService.get(id!),
		enabled: id !== undefined,
		gcTime: 0,
	});
}

export function useEditSkladMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: SkladEditPayload }) => skladService.edit(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skladKeys.all });
			queryClient.invalidateQueries({ queryKey: ['warehouse'] });
			queryClient.invalidateQueries({ queryKey: ['sklad-products'] });
		},
	});
}

export function useUpdateSkladMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: SkladUpdatePayload }) => skladService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skladKeys.all });
		},
	});
}

export function useDeleteSkladMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => skladService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skladKeys.all });
		},
	});
}
