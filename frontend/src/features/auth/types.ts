export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}
