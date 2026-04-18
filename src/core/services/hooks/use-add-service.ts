import useSWRMutation from 'swr/mutation'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  createService,
  type ServiceRequest,
  type BaseResponse,
  type Service,
} from '@/services/rest-api/app-api/services/service'

const mutator = (_key: string, { arg }: { arg: ServiceRequest }) =>
  createService(arg)

export const useAddService = () => {
  const { trigger, isMutating } = useSWRMutation<
    BaseResponse<Service>,
    Error,
    string,
    ServiceRequest
  >(SWR_KEYS.ADD_SERVICE, mutator)

  return {
    add: (payload: ServiceRequest) => trigger(payload),
    isAdding: isMutating,
  }
}
