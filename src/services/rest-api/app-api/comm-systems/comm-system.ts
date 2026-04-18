import type { BaseResponse } from '@/types/common'
import { commSystemsService } from './_service-instance'

/**
 * Spec: select system_code, system_name from comm_system where status = 1 order by system_name
 */
export type CommSystemResponse = {
  systemCode: string
  systemName: string
}

export const listCommSystems = (params?: { status?: number }) => {
  return commSystemsService.get<BaseResponse<CommSystemResponse[]>>('', {
    params,
  })
}
