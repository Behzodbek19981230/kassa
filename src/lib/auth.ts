import { useSyncExternalStore } from 'react'
import { queryClient } from '@/services/api/queryClient'
import type { LoginResponse } from '@/services/auth/auth.types'

const ACCESS_TOKEN_KEY = 'ca_access_token'
const REFRESH_TOKEN_KEY = 'ca_refresh_token'
// Kept in localStorage so every tab and a reload see the same idle clock.
const LAST_ACTIVITY_KEY = 'ca_last_activity'

// Lets root-level components (e.g. CompanyProvider) react to login/logout without a page reload.
const sessionListeners = new Set<() => void>()
function notifySessionChange() {
  sessionListeners.forEach((l) => l())
}
function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

export function setSession(tokens: LoginResponse, remember: boolean) {
  // a new login must never reuse the previous user's cached data (user-info/role etc.)
  queryClient.clear()
  const storage = remember ? localStorage : sessionStorage

  storage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
  setLastActivity(Date.now())
  notifySessionChange()
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)
  // drop cached user info/permissions so the next login doesn't see the previous role's data
  queryClient.clear()
  notifySessionChange()
}

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

/** Stores refreshed tokens in whichever storage the session was created in. */
export function setTokens(access: string, refresh?: string) {
  const storage = localStorage.getItem(REFRESH_TOKEN_KEY) ? localStorage : sessionStorage
  storage.setItem(ACCESS_TOKEN_KEY, access)
  if (refresh) storage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function getLastActivity(): number | null {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
  return value > 0 ? value : null
}

export function setLastActivity(at: number) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(at))
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribeSession, isAuthenticated)
}
