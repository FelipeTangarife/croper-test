import { api } from '@/lib/api'
import type { LoginPayload, LoginResponse } from '../types'

export const LOGIN_PATH = '/auth/login'

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(LOGIN_PATH, payload)
    return data
  },
}
