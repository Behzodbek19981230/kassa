import axios from 'axios'
import { useEffect } from 'react'
import {
  clearSession,
  getLastActivity,
  getRefreshToken,
  getToken,
  setLastActivity,
  setTokens,
  useIsAuthenticated,
} from '@/lib/auth'
import { API_BASE_URL, apiClient } from '@/services/api/client'

/*
 * Logs the user out after 10 minutes without real activity (clicks, keys, scroll, touch).
 * The backend enforces the same limit per session (`sid`); background requests don't extend it,
 * only `POST /auth/activity/`, which is sent at most once a minute while the user is active.
 */

const IDLE_LIMIT_MS = 10 * 60 * 1000
const ACTIVITY_PING_INTERVAL_MS = 60 * 1000
const ACTIVITY_THROTTLE_MS = 5 * 1000
const CHECK_INTERVAL_MS = 15 * 1000
const REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart']

export type LogoutReason = 'idle_timeout' | 'session_expired' | 'session_invalid' | 'logout'

type ChannelMessage = { type: 'activity'; at: number } | { type: 'logout'; reason: LogoutReason }

const state = {
  lastActivityAt: Date.now(),
  lastActivityPingAt: 0,
  activityDirty: false,
  lastHandledActivityAt: 0,
  refreshPromise: null as Promise<string> | null,
  logoutStarted: false,
}

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('savdo-soft-auth') : null

function broadcast(message: ChannelMessage) {
  channel?.postMessage(message)
}

function idleFor() {
  return Date.now() - state.lastActivityAt
}

function tokenExpiresAt(token: string): number {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    return Number(payload.exp) * 1000
  } catch {
    return 0
  }
}

/** Clears the tokens and goes to the login page. `notifyTabs` is false for a logout another tab announced. */
function endSession(reason: LogoutReason, notifyTabs: boolean) {
  state.logoutStarted = true
  clearSession()
  if (notifyTabs) broadcast({ type: 'logout', reason })
  if (window.location.pathname !== '/login') {
    window.location.replace(reason === 'logout' ? '/login' : `/login?reason=${reason}`)
  }
}

export function forceLocalLogout(reason: LogoutReason) {
  if (state.logoutStarted) return
  endSession(reason, true)
}

/** Ends the session on the backend too; tokens are cleared locally even when the request fails. */
export async function logout(reason: LogoutReason = 'logout') {
  if (state.logoutStarted) return
  state.logoutStarted = true
  const refresh = getRefreshToken()
  try {
    if (refresh) await apiClient.post('/auth/logout/', { refresh }, { timeout: 5_000 })
  } catch {
    // offline or the session is already gone; the local logout below still happens
  } finally {
    endSession(reason, true)
  }
}

/**
 * Refreshes the access token. Concurrent callers share one request. Without `force` it only
 * refreshes when the token is about to expire.
 */
export async function refreshAccessToken(force = false): Promise<string | null> {
  const access = getToken()
  const refresh = getRefreshToken()
  if (!access || !refresh) return null

  if (idleFor() >= IDLE_LIMIT_MS) {
    await logout('idle_timeout')
    return null
  }
  if (!force && tokenExpiresAt(access) - Date.now() > REFRESH_BEFORE_EXPIRY_MS) return access

  if (!state.refreshPromise) {
    state.refreshPromise = axios
      .post<{ access: string; refresh?: string }>(`${API_BASE_URL}/auth/token/refresh/`, { refresh })
      .then(({ data }) => {
        setTokens(data.access, data.refresh)
        return data.access
      })
      .catch((error) => {
        forceLocalLogout('session_expired')
        throw error
      })
      .finally(() => {
        state.refreshPromise = null
      })
  }
  return state.refreshPromise
}

async function sendActivityIfNeeded() {
  if (!state.activityDirty || state.logoutStarted || !getToken()) return
  if (Date.now() - state.lastActivityPingAt < ACTIVITY_PING_INTERVAL_MS) return

  // Set before the request so a burst of events doesn't send several pings.
  state.lastActivityPingAt = Date.now()
  try {
    await apiClient.post('/auth/activity/')
    state.activityDirty = false
  } catch {
    // stays dirty and is retried on the next check
    state.lastActivityPingAt = 0
  }
}

function recordActivity(at: number) {
  state.lastActivityAt = Math.max(state.lastActivityAt, at)
  setLastActivity(state.lastActivityAt)
}

function onUserActivity() {
  const now = Date.now()
  if (now - state.lastHandledActivityAt < ACTIVITY_THROTTLE_MS) return
  state.lastHandledActivityAt = now
  recordActivity(now)
  state.activityDirty = true
  broadcast({ type: 'activity', at: now })
  void sendActivityIfNeeded()
}

function verifyIdleImmediately() {
  if (state.logoutStarted || !getToken()) return
  // Another tab may have been active meanwhile.
  const stored = getLastActivity()
  if (stored) state.lastActivityAt = Math.max(state.lastActivityAt, stored)
  if (idleFor() >= IDLE_LIMIT_MS) void logout('idle_timeout')
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') verifyIdleImmediately()
}

function onChannelMessage(event: MessageEvent<ChannelMessage>) {
  const message = event.data
  if (message.type === 'activity') recordActivity(Number(message.at))
  if (message.type === 'logout' && !state.logoutStarted) endSession(message.reason, false)
}

function startSessionWatcher() {
  const now = Date.now()
  // A reload (or a sleep) after the limit logs out right away; a session from before this
  // feature has no stored time and starts counting now.
  state.lastActivityAt = getLastActivity() ?? now
  state.lastActivityPingAt = now
  state.activityDirty = false
  state.logoutStarted = false
  setLastActivity(state.lastActivityAt)
  verifyIdleImmediately()

  for (const eventName of ACTIVITY_EVENTS) {
    window.addEventListener(eventName, onUserActivity, { passive: true })
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', verifyIdleImmediately)
  window.addEventListener('online', verifyIdleImmediately)
  channel?.addEventListener('message', onChannelMessage)

  // Only checks the local clock; the server is contacted at most once a minute.
  const timer = window.setInterval(async () => {
    if (!getToken() || state.logoutStarted) return
    if (idleFor() >= IDLE_LIMIT_MS) {
      await logout('idle_timeout')
      return
    }
    await sendActivityIfNeeded()
    await refreshAccessToken().catch(() => undefined)
  }, CHECK_INTERVAL_MS)

  return () => {
    window.clearInterval(timer)
    for (const eventName of ACTIVITY_EVENTS) {
      window.removeEventListener(eventName, onUserActivity)
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', verifyIdleImmediately)
    window.removeEventListener('online', verifyIdleImmediately)
    channel?.removeEventListener('message', onChannelMessage)
  }
}

/** Runs the idle watcher while a user is logged in. */
export function useSessionWatcher() {
  const authenticated = useIsAuthenticated()
  useEffect(() => {
    if (!authenticated) return
    return startSessionWatcher()
  }, [authenticated])
}
