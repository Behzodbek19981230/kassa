import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vozvratService } from '@/services/vozvrat/vozvrat.service';
import type {
	VozvratCalculatePayload,
	VozvratConfirmPayload,
	VozvratOrderListParams,
	VozvratOrderUpdatePayload,
	VozvratProductsParams,
	VozvratUpdateVozvratPayload,
} from '@/services/vozvrat/vozvrat.types';

export function useVozvratOrderListQuery(params?: VozvratOrderListParams) {
	return useQuery({
		queryKey: ['vozvrat', 'list', params],
		queryFn: () => vozvratService.list(params),
		placeholderData: (prev) => prev,
	});
}

export function useVozvratOrderQuery(id?: number) {
	return useQuery({
		queryKey: ['vozvrat', 'detail', id],
		queryFn: () => vozvratService.get(id!),
		enabled: id !== undefined,
	});
}

export function useVozvratOrderProductsQuery(id?: number) {
	return useQuery({
		queryKey: ['vozvrat', 'order-products', id],
		queryFn: () => vozvratService.getOrderProducts(id!),
		enabled: id !== undefined,
	});
}

export function useVozvratProductsQuery(params: VozvratProductsParams | undefined) {
	return useQuery({
		queryKey: ['vozvrat', 'products', params],
		queryFn: () => vozvratService.getProducts(params!),
		enabled: Boolean(params?.client_id),
		placeholderData: (prev) => prev,
	});
}

export function useVozvratCalculateMutation() {
	return useMutation({
		mutationFn: (payload: VozvratCalculatePayload) => vozvratService.calculate(payload),
	});
}

export function useVozvratConfirmMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: VozvratConfirmPayload) => vozvratService.confirm(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['vozvrat'] });
			queryClient.invalidateQueries({ queryKey: ['clients'] });
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}

export function useUpdateVozvratOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: VozvratOrderUpdatePayload }) =>
			vozvratService.update(id, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vozvrat'] }),
	});
}

export function useUpdateVozvratSaleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: VozvratUpdateVozvratPayload }) =>
			vozvratService.updateVozvrat(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['vozvrat'] });
			queryClient.invalidateQueries({ queryKey: ['clients'] });
			queryClient.invalidateQueries({ queryKey: ['order-account-history'] });
		},
	});
}

export function useDeleteVozvratOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => vozvratService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vozvrat'] }),
	});
}
