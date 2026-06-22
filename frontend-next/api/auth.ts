import { useMutation, useQuery } from "@tanstack/react-query"
import type { RegisterData, LoginData, TokenResponse } from "@/types"
import api from "./api"
import { getToken } from "@/utils/auth"

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) =>
      api.post<TokenResponse>('/auth/register', data),

    onSuccess: async ({ data }) => {
      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token)

        try {
          const userResponse = await api.get('/auth/me')
          if (userResponse.data) {
            localStorage.setItem('user_data', JSON.stringify(userResponse.data))
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      }
    },

    onError: (error) => {
      console.error('Register error:', error)
    },
  })
}

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginData) => {
      return api.post<TokenResponse>('/auth/login', data)
    },

    onSuccess: async ({ data }) => {
      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token)

        try {
          const userResponse = await api.get('/auth/me')
          if (userResponse.data) {
            localStorage.setItem('user_data', JSON.stringify(userResponse.data))
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      }
    },

    onError: (error) => {
      console.error('Login error:', error)
    },
  })
}

export const useCurrentUser = () => {
  const accessToken = getToken()
  const isLocalMode = accessToken?.startsWith('local_token_')

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('/auth/me'),
    enabled: !!accessToken && !isLocalMode,
    select: (response) => response.data,
  })
}

export const changePassword = async (data: { current_password?: string; new_password: string }) => {
  const response = await api.put('/auth/change-password', data)
  return response.data
}

// has_password=false => foydalanuvchи magic-link orqali kirган, hali parol o'rnатmaган
export const getMe = async (): Promise<{ has_password?: boolean; phone?: string; backup_phone?: string | null }> => {
  const response = await api.get('/auth/me')
  return response.data
}

// ── Parolni tiklash (Telegram orqali) ──
export const forgotPassword = async (phone: string): Promise<{ sent: boolean; expires_in: number }> => {
  const res = await api.post('/auth/forgot-password', { phone })
  return res.data
}

export const verifyResetCode = async (phone: string, code: string): Promise<{ valid: boolean; attempts_left: number }> => {
  const res = await api.post('/auth/verify-reset-code', { phone, code })
  return res.data
}

export const resetPassword = async (phone: string, code: string, new_password: string): Promise<{ message: string }> => {
  const res = await api.post('/auth/reset-password', { phone, code, new_password })
  return res.data
}

// ── Telegram kodi orqali kirish (passwordless login) ──
export const sendLoginCode = async (phone: string): Promise<{ sent: boolean; expires_in: number }> => {
  const res = await api.post('/auth/send-login-code', { phone })
  return res.data
}

export const verifyLoginCode = async (
  phone: string,
  code: string,
): Promise<{ access_token: string; token_type: string }> => {
  const res = await api.post('/auth/verify-login-code', { phone, code })
  return res.data
}

export const getBackupPhone = async (): Promise<{ backup_phone: string | null }> => {
  const response = await api.get('/auth/backup-phone')
  return response.data
}

export const updateBackupPhone = async (data: { backup_phone: string | null }) => {
  const response = await api.put('/auth/backup-phone', data)
  return response.data
}
