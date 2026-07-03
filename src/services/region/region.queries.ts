import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regionService } from '@/services/region/region.service';
import type { RegionListParams, RegionPayload } from '@/services/region/region.types';

const regionKeys = {
	all: ['regions'] as const,
	list: (params?: RegionListParams) => ['regions', 'list', params] as const,
};

export function useRegionListQuery(params?: RegionListParams) {
	return useQuery({
		queryKey: regionKeys.list(params),
		queryFn: () => regionService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useCreateRegionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: RegionPayload) => regionService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: regionKeys.all }),
	});
}

export function useUpdateRegionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: RegionPayload }) => regionService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: regionKeys.all }),
	});
}

export function useDeleteRegionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => regionService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: regionKeys.all }),
	});
}
