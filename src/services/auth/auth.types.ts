export interface LoginRequest {
  username: string
  password: string
  /** Ends the account's session on another device (the backend answered 409 `session_active`). */
  force?: boolean
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface LogoutRequest {
  refresh: string
}
