import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company/company.service';
import type { CompanyListParams, CompanyPayload } from '@/services/company/company.types';

const companyKeys = {
	all: ['companies'] as const,
	list: (params?: CompanyListParams) => ['companies', 'list', params] as const,
};

export function useCompanyListQuery(params?: CompanyListParams, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: companyKeys.list(params),
		queryFn: () => companyService.list(params),
		placeholderData: (prev) => prev,
		enabled: options?.enabled,
	});
}

export function useCreateCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ payload, logo }: { payload: CompanyPayload; logo?: File | null }) =>
			companyService.create(payload, logo),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
	});
}

export function useUpdateCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload, logo }: { id: number; payload: CompanyPayload; logo?: File | null }) =>
			companyService.update(id, payload, logo),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
	});
}

export function useDeleteCompanyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => companyService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
	});
}
