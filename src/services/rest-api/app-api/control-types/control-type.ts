import type { BaseResponse } from '@/types/common'
import { controlTypesService } from './_service-instance'

export type CommControlTypeItem = {
    id: number
    code: string
    name: string
}

export const getControlTypes = async (): Promise<BaseResponse<CommControlTypeItem[]>> => {
    return controlTypesService.get<BaseResponse<CommControlTypeItem[]>>('')
}
