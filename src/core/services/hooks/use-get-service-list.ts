import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getServices,
  type ServiceSearchParams,
  type PageResponse,
  type Service,
} from '@/services/rest-api/app-api/services/service'

export const useGetServiceList = (params?: ServiceSearchParams) => {
  const { data, error, isLoading, mutate } = useAxiosSWR<PageResponse<Service[]>>(
    [SWR_KEYS.SERVICE_LIST, params],
    async ([, qp]) => getServices(qp),
    { revalidateOnMount: true },
  )

  return {
    data,
    list: data?.data ?? [],
    error,
    isLoading,
    mutate,
  }
}
