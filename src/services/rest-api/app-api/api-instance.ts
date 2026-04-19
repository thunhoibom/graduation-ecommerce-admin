import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { Modal } from 'antd'
import { HTTP_HEADERS } from '@/shared/constants'
import { AppApiError, getErrorMessage } from './error-handle'
import { TServerError } from './types'
import { APP_API_URL } from '@/config'

const appApiIns = axios.create({
  baseURL: APP_API_URL,
  headers: {
    [HTTP_HEADERS.ContentType]: 'application/json',
  },
})

appApiIns.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip auth header for public endpoints
    const isPublicRequest =
      config.url?.includes('/api/public/auth/login') ||
      config.url?.includes('/api/public/auth/register') ||
      config.url?.includes('/api/public/')

    if (!isPublicRequest) {
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      } else {
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

let isSessionExpiredModalShowing = false

appApiIns.interceptors.response.use(
  (response) => {
    // Blob responses (file downloads) – return raw response
    if (response.data instanceof Blob) return response
    return response.data
  },
  async (error: AxiosError<TServerError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const isAuthRequest =
      originalRequest?.url?.includes('/api/public/auth/login') ||
      originalRequest?.url?.includes('/api/public/auth/refresh')

    // 401 on non-auth request → session expired
    if (error.response?.status === 401 && originalRequest && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true

      if (!isSessionExpiredModalShowing) {
        isSessionExpiredModalShowing = true
        Modal.error({
          title: 'Phiên đăng nhập hết hạn',
          content: 'Vui lòng đăng nhập lại để tiếp tục.',
          okText: 'Đồng ý',
          maskClosable: false,
          okButtonProps: {
            type: 'primary',
            style: {
              backgroundColor: '#5856d6',
              borderColor: '#5856d6',
            },
          },
          onOk: async () => {
            const { authService } = await import('./auth/authService')
            authService.clearSession()
            window.location.href = '/login'
          },
        })
      }
      // "Freeze" request — prevent UI from showing additional error messages
      return new Promise(() => { })
    }

    // Business error from backend
    if (error.response?.data) {
      return Promise.reject(
        new AppApiError({
          ...error.response?.data,
          name: 'COMMON_ERROR',
          status: error.response.status,
        }),
      )
    }

    // Network error
    return Promise.reject(error)
  },
)

export { appApiIns }
