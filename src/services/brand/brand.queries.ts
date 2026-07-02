import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandService } from '@/services/brand/brand.service';
import type { BrandListParams, BrandPayload } from '@/services/brand/brand.types';

const brandKeys = {
	all: ['brands'] as const,
	list: (params?: BrandListParams) => ['brands', 'list', params] as const,
};

export function useBrandListQuery(params?: BrandListParams) {
	return useQuery({
		queryKey: brandKeys.list(params),
		queryFn: () => brandService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useCreateBrandMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: BrandPayload) => brandService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.all }),
	});
}

export function useUpdateBrandMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: BrandPayload }) => brandService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.all }),
	});
}

export function useDeleteBrandMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => brandService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.all }),
	});
}
