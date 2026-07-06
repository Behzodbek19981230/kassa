import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { districtService } from '@/services/district/district.service';
import type { DistrictListParams, DistrictPayload } from '@/services/district/district.types';

const districtKeys = {
	all: ['districts'] as const,
	list: (params?: DistrictListParams) => ['districts', 'list', params] as const,
	detail: (id: number) => ['districts', 'detail', id] as const,
};

export function useDistrictListQuery(params?: DistrictListParams) {
	return useQuery({
		queryKey: districtKeys.list(params),
		queryFn: () => districtService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useDistrictQuery(id?: number) {
	return useQuery({
		queryKey: districtKeys.detail(id ?? 0),
		queryFn: () => districtService.get(id as number),
		enabled: typeof id === 'number',
	});
}

export function useCreateDistrictMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: DistrictPayload) => districtService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: districtKeys.all }),
	});
}

export function useUpdateDistrictMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: DistrictPayload }) => districtService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: districtKeys.all }),
	});
}

export function useDeleteDistrictMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => districtService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: districtKeys.all }),
	});
}
