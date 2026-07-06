import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '@/lib/auth'
import { userService } from '@/services/user/user.service'
import type { UserListParams, UserPayload } from '@/services/user/user.types'

export function useUserInfoQuery() {
  return useQuery({
    queryKey: ['user-info'],
    queryFn: userService.getMe,
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
  })
}

const userKeys = {
  all: ['users'] as const,
  list: (params?: UserListParams) => ['users', 'list', params] as const,
  detail: (id: number) => ['users', 'detail', id] as const,
}

export function useUserListQuery(params?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useUserQuery(id?: number) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: () => userService.get(id as number),
    enabled: typeof id === 'number',
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload, avatar }: { payload: UserPayload; avatar?: File | null }) =>
      userService.create(payload, avatar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload, avatar }: { id: number; payload: UserPayload; avatar?: File | null }) =>
      userService.update(id, payload, avatar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
