import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vozvratOrderProductService } from '@/services/vozvrat-order-product/vozvrat-order-product.service';
import type { VozvratOrderProductCreatePayload } from '@/services/vozvrat-order-product/vozvrat-order-product.types';

export function useCreateVozvratOrderProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: VozvratOrderProductCreatePayload) => vozvratOrderProductService.create(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vozvrat'] }),
	});
}

export function useDeleteVozvratOrderProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => vozvratOrderProductService.remove(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vozvrat'] }),
	});
}
