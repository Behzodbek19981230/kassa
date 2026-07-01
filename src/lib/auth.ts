export interface AuthUser {
  email: string
  name: string
}

const TOKEN_KEY = 'ca_auth_token'
const USER_KEY = 'ca_auth_user'

export const DEFAULT_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123',
}

function createMockToken(email: string) {
  const header = btoa(JSON.stringify({ alg: 'mock', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: email, name: 'Adam Schwartz', iat: Date.now() }))
  const signature = btoa(`${Date.now()}.${Math.random().toString(36).slice(2)}`)
  return `${header}.${payload}.${signature}`
}

export function login(email: string, password: string, remember: boolean): AuthUser {
  if (email !== DEFAULT_CREDENTIALS.email || password !== DEFAULT_CREDENTIALS.password) {
    throw new Error('Invalid email or password')
  }

  const user: AuthUser = { email, name: 'Adam Schwartz' }
  const token = createMockToken(email)
  const storage = remember ? localStorage : sessionStorage

  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))

  return user
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
