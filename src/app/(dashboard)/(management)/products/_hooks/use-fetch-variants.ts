'use client'

import { useMemo } from 'react'
import { useSearchParamsState } from '@/shared/hooks/use-search-params-state'
import type { VariantSearchParams } from '@/services/rest-api/app-api/products/product-service'

export type DefaultVariantParams = {
  page: string
  size: string
  productBarcode: string
}

export const DEFAULT_VARIANT_PARAMS: Partial<DefaultVariantParams> = {
  page: '1',
  size: '20',
}

export const useTableFetchingParamsForVariants = <T extends Record<string, string | undefined>>(
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