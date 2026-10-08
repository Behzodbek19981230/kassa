import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsCompanyService } from '@/services/logistics-company/logistics-company.service';
import type {
	LogisticsCompanyListParams,
	LogisticsCompanyPayload,
} from '@/services/logistics-company/logistics-company.types';

const logisticsCompanyKeys = {
	all: ['logistics-company'] as const,
	list: (params?: LogisticsCompanyListParams) => ['logistics-company', 'list', params] as const,
	detail: (id: number) => ['logistics-company', 'detail', id] as const,
};

export function useLogisticsCompanyListQuery(params?: LogisticsCompanyListParams) {
	return useQuery({
		queryKey: logisticsCompanyKeys.list(params),
		queryFn: () => logisticsCompanyService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useLogisticsCompanyQuery(id?: number) {
	return useQuery({
		queryKey: logisticsCompanyKeys.detail(id ?? 0),
		queryFn: () => logisticsCompanyService.get(id as number),
		enabled: typeof id === 'number',
	});
}

export function useCreateLogisticsCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: LogisticsCompanyPayload) => logisticsCompanyService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: logisticsCompanyKeys.all }),
	});
}

export function useUpdateLogisticsCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: LogisticsCompanyPayload }) =>
			logisticsCompanyService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: logisticsCompanyKeys.all }),
	});
}

export function useDeleteLogisticsCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => logisticsCompanyService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: logisticsCompanyKeys.all }),
	});
}
