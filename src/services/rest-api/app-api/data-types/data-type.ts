import type { BaseResponse } from '@/types/common'
import { dataTypesService } from './_service-instance'

export type CommDataTypeItem = {
  id: number
  code: string
  name: string
}

export const getDataTypes = async (): Promise<BaseResponse<CommDataTypeItem[]>> => {
  return dataTypesService.get<BaseResponse<CommDataTypeItem[]>>('')
}
