import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consignorService } from '@/services/consignor/consignor.service';
import type { ConsignorListParams, ConsignorPayload } from '@/services/consignor/consignor.types';

const consignorKeys = {
	all: ['consignors'] as const,
	list: (params?: ConsignorListParams) => ['consignors', 'list', params] as const,
};

export function useConsignorListQuery(params?: ConsignorListParams) {
	return useQuery({
		queryKey: consignorKeys.list(params),
		queryFn: () => consignorService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useCreateConsignorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ConsignorPayload) => consignorService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: consignorKeys.all }),
	});
}

export function useUpdateConsignorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: ConsignorPayload }) => consignorService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: consignorKeys.all }),
	});
}

export function useDeleteConsignorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => consignorService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: consignorKeys.all }),
	});
}
