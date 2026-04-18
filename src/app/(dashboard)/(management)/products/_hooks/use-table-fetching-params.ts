import { useMemo } from 'react'
import { useSearchParamsState } from '@/shared/hooks/use-search-params-state'

type TTableParams = Record<string, string | undefined>

export const useTableFetchingParams = <T extends TTableParams>(
  defaultParams?: Partial<T>,
) => {
  const { params, setSearchParamsState } =
    useSearchParamsState<T>({
      defaultParams: (defaultParams ?? {}) as T,
    })

  const setTableFetchingParams = (newParams: Partial<T>) => {
    setSearchParamsState({ ...params, ...newParams } as T)
  }

  const queryParams = useMemo<T>(
    () => ({ ...(defaultParams ?? {}), ...params } as T),
    [params],
  )

  return {
    queryParams,
    tableFetchingParams: { ...(defaultParams ?? {}), ...params },
    setTableFetchingParams,
  }
}
