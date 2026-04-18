import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { BaseJsonResponse } from '@/types/common'
import { HTTP_HEADERS } from '@/shared/constants'

const apiInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    [HTTP_HEADERS.ContentType]: 'application/json',
  },
})

// Request Interceptor
apiInstance.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')

      if (token) {
        const headers = AxiosHeaders.from(config.headers)
        headers.set('Authorization', `Bearer ${token}`)
        config.headers = headers
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    // Handle global errors here
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  },
)

class BaseService {
  protected api: AxiosInstance = apiInstance

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<BaseJsonResponse<T>> {
    return this.api.get(url, config)
  }

  public async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<BaseJsonResponse<T>> {
    return this.api.post(url, data, config)
  }

  public async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<BaseJsonResponse<T>> {
    return this.api.put(url, data, config)
  }

  public async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<BaseJsonResponse<T>> {
    return this.api.patch(url, data, config)
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<BaseJsonResponse<T>> {
    return this.api.delete(url, config)
  }
}

export default new BaseService()
export { apiInstance }
