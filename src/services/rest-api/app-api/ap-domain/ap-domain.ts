import { apDomainService } from './_service-instance'

export type ApDomainItem = {
  code: string
  name: string
}

export type BaseResponse<T> = {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

const COMMON_VARIABLE_TYPE = 'INPUT_DEF_COMMON_VARIABLE'

export const getCommonVariables = async (): Promise<BaseResponse<ApDomainItem[]>> => {
  return apDomainService.get<BaseResponse<ApDomainItem[]>>('', {
    params: { type: COMMON_VARIABLE_TYPE },
  })
}

export const listApDomains = async (type: string): Promise<BaseResponse<ApDomainItem[]>> => {
  return apDomainService.get<BaseResponse<ApDomainItem[]>>('', {
    params: { type },
  })
}
