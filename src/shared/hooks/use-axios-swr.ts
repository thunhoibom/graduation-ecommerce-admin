import { useAxios } from './use-axios'
import { SWRConfiguration } from 'swr'

export type Config<Data = unknown, Error = unknown> = SWRConfiguration<Data, Error> & {
  revalidateWhenUndefined?: boolean,
  showErrorNotification?: boolean
}

/**
 * @deprecated Chuyển sang dùng useAxios để thuần axios hơn. 
 * Hook này hiện tại đã được chuyển sang dùng logic Axios thuần túy (không cache).
 */
export function useAxiosSWR<Data = any, Error = any>(
  key: any,
  fetcher: ((...args: any[]) => Promise<Data>) | null,
  config: Config<Data, Error> = {},
) {
  const { data, error, isLoading, mutate } = useAxios<Data>(
    async () => {
      if (!fetcher) throw new Error('Fetcher is required')
      // SWR thường truyền key vào fetcher, chúng ta giả lập điều đó nếu cần
      if (Array.isArray(key)) {
        return fetcher(...key)
      }
      return fetcher(key)
    },
    {
      enabled: !!key && !!fetcher,
      showErrorNotification: config.showErrorNotification,
      deps: [JSON.stringify(key)], // Coi key như dependency của useEffect
    }
  )

  return {
    data,
    error,
    isLoading,
    isInitializing: isLoading && !data,
    isValidating: isLoading,
    mutate,
  }
}
