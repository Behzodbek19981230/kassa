import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth/auth.service'
import type { LoginRequest, LogoutRequest } from '@/services/auth/auth.types'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (payload: LogoutRequest) => authService.logout(payload),
  })
}
