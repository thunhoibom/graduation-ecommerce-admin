import useSWR, { SWRResponse, Key, SWRConfiguration } from 'swr'
import { AxiosError } from 'axios'
import { useEffect, useMemo } from 'react'
import { App } from 'antd'
import { getErrorMessage } from '@/services/rest-api/app-api/error-handle'

interface Return<Data, Error> extends Pick<
  SWRResponse<Data, AxiosError<Error>>,
  'isValidating' | 'error' | 'mutate'
> {
  data: Data | undefined
  isInitializing: boolean
  isLoading: boolean
}

export type Config<Data = unknown, Error = unknown> = SWRConfiguration<Data, Error> & {
  revalidateWhenUndefined?: boolean,
  showErrorNotification?: boolean
}

export type UseAxiosSWRFetcher<Data> = (...args: any[]) => Promise<Data>
export type ObjectKey<T extends Record<string, unknown>> = T & {
  key: string
}

export function useAxiosSWR<Data = any, Error = any>(
  key: Key,
  fetcher: UseAxiosSWRFetcher<Data> | null,
  {
    fallbackData,
    revalidateWhenUndefined,
    showErrorNotification = true,
    revalidateOnFocus = false,
    ...config
  }: Config<Data, Error> = {},
): Return<Data, Error> {
  const { message } = App.useApp()

  /* eslint-disable */

  const optimizedKey = useMemo(() => {
    if (Array.isArray(key)) {
      return key
    }

    if (!!key && typeof key === 'object') {
      return Object.entries(key).reduce(
        (acc, [field, value]) => ({
          ...acc,
          [field]: ['number'].includes(typeof value) ? String(value) : value,
        }),
        {},
      )
    }

    return key
  }, [key])

  const { data, error, isValidating, mutate } = useSWR(optimizedKey, fetcher, config)

  useEffect(() => {
    if (revalidateWhenUndefined && typeof data === 'undefined') {
      mutate()
    }
  }, [revalidateWhenUndefined])

  useEffect(() => {
    if (showErrorNotification && error) {
      message.error(getErrorMessage(error))
    }
  }, [showErrorNotification, error])

  const isInitializing = !data && !error
  const isLoading = isInitializing || isValidating

  return {
    data,
    error,
    isValidating,
    isInitializing,
    isLoading,
    mutate,
  }
}
