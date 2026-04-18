import type { BaseResponse } from '@/types/common'
import { plansService } from './_service-instance'

export const deactivateCriteria = (
  planId: number,
  verifyId: number,
  criteriaId: number,
) => {
  return plansService.put<BaseResponse<void>>(
    `/${planId}/verifies/${verifyId}/criteria/${criteriaId}/deactivate`,
  )
}

export const deactivatePriceCriteria = (
  planId: number,
  priceId: number,
  criteriaId: number,
) => {
  return plansService.put<BaseResponse<void>>(
    `/${planId}/prices/${priceId}/criteria/${criteriaId}/deactivate`,
  )
}
