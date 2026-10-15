import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skladProductService } from '@/services/sklad-product/sklad-product.service';
import type { SkladProductListParams, SkladProductPayload } from '@/services/sklad-product/sklad-product.types';

export const skladProductKeys = {
	list: ['sklad-products'] as const,
	listParams: (params?: SkladProductListParams) => ['sklad-products', params] as const,
	pair: (warehouse?: number, typeSklad?: number) => ['sklad-products', 'pair', warehouse, typeSklad] as const,
	detail: (id: number) => ['sklad-product', id] as const,
};

export function useSkladProductListQuery(params?: SkladProductListParams, enabled = true) {
	return useQuery({
		queryKey: skladProductKeys.listParams(params),
		queryFn: () => skladProductService.list(params),
		placeholderData: (prev) => prev,
		enabled,
	});
}

// The stock row of one product in one sklad (null when the product isn't in that sklad yet).
export function useSkladProductByPairQuery(warehouse?: number, typeSklad?: number) {
	return useQuery({
		queryKey: skladProductKeys.pair(warehouse, typeSklad),
		queryFn: () => skladProductService.findByPair(warehouse as number, typeSklad as number),
		enabled: typeof warehouse === 'number' && typeof typeSklad === 'number',
	});
}

export function useSkladProductQuery(id?: number) {
	return useQuery({
		queryKey: skladProductKeys.detail(id ?? 0),
		queryFn: () => skladProductService.get(id as number),
		enabled: typeof id === 'number',
	});
}

function useInvalidateSkladProducts() {
	const queryClient = useQueryClient();
	return (id?: number) => {
		queryClient.invalidateQueries({ queryKey: skladProductKeys.list });
		// Stock rows are also shown through the warehouse catalog.
		queryClient.invalidateQueries({ queryKey: ['warehouse'] });
		if (id !== undefined) queryClient.invalidateQueries({ queryKey: skladProductKeys.detail(id) });
	};
}

export function useCreateSkladProductMutation() {
	const invalidate = useInvalidateSkladProducts();
	return useMutation({
		mutationFn: (payload: SkladProductPayload) => skladProductService.create(payload),
		onSuccess: () => invalidate(),
	});
}

export function useUpdateSkladProductMutation() {
	const invalidate = useInvalidateSkladProducts();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: Partial<SkladProductPayload> }) =>
			skladProductService.update(id, payload),
		onSuccess: (_data, { id }) => invalidate(id),
	});
}

export function useDeleteSkladProductMutation() {
	const invalidate = useInvalidateSkladProducts();
	return useMutation({
		mutationFn: (id: number) => skladProductService.remove(id),
		onSuccess: (_data, id) => invalidate(id),
	});
}
