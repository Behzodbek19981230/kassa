import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importCartDraftService } from '@/services/import-cart-draft/import-cart-draft.service';
import type {
	ImportCartDraftListParams,
	ImportCartDraftPayload,
} from '@/services/import-cart-draft/import-cart-draft.types';

const importCartDraftKeys = {
	all: ['import-cart-draft'] as const,
	list: (params?: ImportCartDraftListParams) => ['import-cart-draft', 'list', params] as const,
};

export function useImportCartDraftListQuery(params?: ImportCartDraftListParams, enabled = true) {
	return useQuery({
		queryKey: importCartDraftKeys.list(params),
		queryFn: () => importCartDraftService.list(params),
		enabled,
	});
}

export function useCreateImportCartDraftMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ImportCartDraftPayload) => importCartDraftService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: importCartDraftKeys.all }),
	});
}

export function useUpdateImportCartDraftMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: ImportCartDraftPayload }) =>
			importCartDraftService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: importCartDraftKeys.all }),
	});
}

export function useDeleteImportCartDraftMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => importCartDraftService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: importCartDraftKeys.all }),
	});
}
