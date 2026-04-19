import { useState, useEffect, useCallback, useRef } from 'react'
import { AxiosError } from 'axios'
import { App } from 'antd'
import { getErrorMessage } from '@/services/rest-api/app-api/error-handle'

interface UseAxiosOptions<T> {
  enabled?: boolean
  showErrorNotification?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: AxiosError) => void
  deps?: any[]
}

export function useAxios<T = any>(
  fetcher: () => Promise<T>,
  options: UseAxiosOptions<T> = {}
) {
  const {
    enabled = true,
    showErrorNotification = true,
    onSuccess,
    onError,
    deps = []
  } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<AxiosError | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const { message } = App.useApp()

  // Dùng ref để tránh fetch lại khi component re-render không cần thiết
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const execute = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcherRef.current()
      setData(result)
      onSuccess?.(result)
    } catch (err: any) {
      const axiosError = err as AxiosError
      setError(axiosError)

      if (showErrorNotification) {
        message.error(getErrorMessage(axiosError))
      }

      onError?.(axiosError)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, showErrorNotification, ...deps])

  useEffect(() => {
    if (enabled) {
      execute()
    }
  }, [enabled, ...deps])

  return {
    data,
    error,
    isLoading,
    mutate: execute, // giữ tên mutate để tương thích ngược
    refetch: execute,
  }
}
