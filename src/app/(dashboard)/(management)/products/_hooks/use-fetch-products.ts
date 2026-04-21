import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import { searchProducts, type ProductSearchParams, type ProductPojo, type PageResponse } from '@/services/rest-api/app-api/products/product-service'
import { useTableFetchingParams } from './use-table-fetching-params'

export type DefaultProductParams = {
  pageIndex: string
  pageSize: string
}

export const DEFAULT_PRODUCT_PARAMS: Partial<DefaultProductParams> = {
  pageIndex: '0',
  pageSize: '20',
}

export const useFetchProducts = (enabled: boolean = true) => {
  const { queryParams, tableFetchingParams, setTableFetchingParams } =
    useTableFetchingParams<Record<string, string | undefined>>(DEFAULT_PRODUCT_PARAMS)

  const { data, isLoading, mutate } = useAxiosSWR<PageResponse<ProductPojo[]>>(
    enabled ? [SWR_KEYS.PRODUCT_LIST, queryParams] : null,
    async () => {
      const searchParams: ProductSearchParams = { ...queryParams } as any
      if (typeof queryParams.minPrice === 'string') {
        searchParams.minPrice = Number(queryParams.minPrice)
      }
      if (typeof queryParams.maxPrice === 'string') {
        searchParams.maxPrice = Number(queryParams.maxPrice)
      }
      if (typeof queryParams.pageIndex === 'string') {
        searchParams.pageIndex = Number(queryParams.pageIndex)
      }
      if (typeof queryParams.pageSize === 'string') {
        searchParams.pageSize = Number(queryParams.pageSize)
      }
      return searchProducts(searchParams)
    },
    { revalidateOnMount: true },
  )

  return {
    data,
    tableData: enabled ? (data?.items ?? []) : [],
    isLoading: enabled ? isLoading : false,
    mutate,
    queryParams,
    tableFetchingParams,
    setTableFetchingParams,
  }
}