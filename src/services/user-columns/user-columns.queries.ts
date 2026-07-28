import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userColumnsService } from '@/services/user-columns/user-columns.service';
import type { UserColumnPayload } from '@/services/user-columns/user-columns.types';

const userColumnsKeys = {
	all: ['user-columns'] as const,
	detail: (user: number | null, key: string) => ['user-columns', 'detail', user, key] as const,
};

export function useUserColumnQuery(user: number | null, key: string) {
	return useQuery({
		queryKey: userColumnsKeys.detail(user, key),
		queryFn: async () => {
			const data = await userColumnsService.list({ user: user!, key, limit: 1 });
			return data.results[0] ?? null;
		},
		enabled: user != null && key !== '',
		staleTime: 5 * 60_000,
	});
}

export function useSaveUserColumnMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id?: number; payload: UserColumnPayload }) =>
			id ? userColumnsService.update(id, payload) : userColumnsService.create(payload),
		onSuccess: (data) => {
			queryClient.setQueryData(userColumnsKeys.detail(data.user, data.key), data);
		},
	});
}
