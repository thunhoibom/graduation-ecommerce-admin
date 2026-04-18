import useSWRMutation from 'swr/mutation'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  updateService,
  type ServiceRequest,
  type BaseResponse,
  type Service,
} from '@/services/rest-api/app-api/services/service'

type TArgs = [id: number, payload: ServiceRequest]

const mutator = (_key: string, { arg }: { arg: TArgs }) =>
  updateService(arg[0], arg[1])

export const useUpdateService = () => {
  const { trigger, isMutating } = useSWRMutation<
    BaseResponse<Service>,
    Error,
    string,
    TArgs
  >(SWR_KEYS.UPDATE_SERVICE, mutator)

  return {
    update: (id: number, payload: ServiceRequest) => trigger([id, payload]),
    isUpdating: isMutating,
  }
}
