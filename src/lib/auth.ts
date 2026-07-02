import type { LoginResponse } from '@/services/auth/auth.types'

const ACCESS_TOKEN_KEY = 'ca_access_token'
const REFRESH_TOKEN_KEY = 'ca_refresh_token'

export function setSession(tokens: LoginResponse, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage

  storage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
