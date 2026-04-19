import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import { searchProducts, type ProductSearchParams, type ProductPojo, type PageResponse } from '@/services/rest-api/app-api/products/product-service'
import { useTableFetchingParams } from './use-table-fetching-params'

export type DefaultProductParams = {
  page: string
  size: string
}

export const DEFAULT_PRODUCT_PARAMS: Partial<DefaultProductParams> = {
  page: '1',
  size: '20',
}

export const useFetchProducts = (enabled: boolean = true) => {
  const { queryParams, tableFetchingParams, setTableFetchingParams } =
    useTableFetchingParams<Record<string, string | undefined>>(DEFAULT_PRODUCT_PARAMS)

  const { data, isLoading, mutate } = useAxiosSWR<PageResponse<ProductPojo[]>>(
    enabled ? [SWR_KEYS.PRODUCT_LIST, queryParams] : null,
    async () => searchProducts(queryParams as unknown as ProductSearchParams),
    { revalidateOnMount: true },
  )

  return {
    data,
    tableData: enabled ? (data?.data ?? []) : [],
    isLoading: enabled ? isLoading : false,
    mutate,
    queryParams,
    tableFetchingParams,
    setTableFetchingParams,
  }
}