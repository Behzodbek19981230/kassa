import { useQuery } from '@tanstack/react-query'
import { isAuthenticated } from '@/lib/auth'
import { userService } from '@/services/user/user.service'

export function useUserInfoQuery() {
  return useQuery({
    queryKey: ['user-info'],
    queryFn: userService.getMe,
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
  })
}
