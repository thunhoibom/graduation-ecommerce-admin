import type { BaseResponse, PageResponse } from '@/types/common'
import { calculationService } from './_service-instance'

export type CalculationPlan = {
  id: number
  txtCode: string
  txtName: string
  txtIncentiveName?: string
  intStatus?: number
  txtStatus?: string
  txtDatetime?: string
  txtEffectDate?: string
  txtExpireDate?: string
  txtCycleName?: string
  txtCreator?: string
  txtApproveDate?: string
  txtApproveUser?: string
  txtDescription?: string
}

export type CalculationPlanSearchParams = {
  txtIncentiveCode?: string
  intIncentiveId?: number
  txtPlanCode?: string
  intPayeeId?: number
  page?: number
  size?: number
}

export type CalculationHistoryRow = {
  planHisId: number
  txtCycle?: string
  txtMonth?: string
  dtExecuteDatetime?: string
  dtCompletedDatetime?: string
  txtUser?: string
  intStatus?: number
  actionType?: string
}

export type CalculationHistorySearchParams = {
  page?: number
  size?: number
}

export type CalculationHistoryDetailRow = {
  planHisDtlId: number
  txtExecuteDatetime?: string
  txtProcessStep?: string
  txtTransTypeName?: string
  txtIsdn?: string
  txtPlanName?: string
  txtIncentiveName?: string
  txtDescription?: string
}

export type TrialRequest = {
  dtFromDate: string // dd/MM/yyyy
  dtToDate: string // dd/MM/yyyy
  arrPayeeId: number[]
  txtDescription?: string
}

export type RecalculateRequest = {
  intCycleExtId: number
  arrPayeeId: number[]
  txtDescription?: string
}

export type CommPlanCycleDropdown = {
  planCycleId: number
  displayName: string
  cycleNumber: number
  startDate: string
  endDate: string
}

export const searchCalculationPlans = (params: CalculationPlanSearchParams) =>
  calculationService.get<PageResponse<CalculationPlan>>('/plans', { params })

export const getCalculationHistory = (planId: number, params: CalculationHistorySearchParams) =>
  calculationService.get<PageResponse<CalculationHistoryRow>>(`/plans/${planId}/history`, {
    params,
  })

export const trialCalculation = (planId: number, body: TrialRequest) =>
  calculationService.post<BaseResponse<any>>(`/plans/${planId}/trial`, body)

export const recalculate = (planId: number, body: RecalculateRequest) =>
  calculationService.post<BaseResponse<any>>(`/plans/${planId}/recalculate`, body)

export const getCalculationHistoryDetail = (
  planHisId: number,
  params: CalculationHistorySearchParams,
) =>
  calculationService.get<PageResponse<CalculationHistoryDetailRow>>(
    `/history/${planHisId}/detail`,
    { params },
  )

export const getCalculationPlanDropdown = (intIncentiveId: number) =>
  calculationService.get<BaseResponse<{ planId: number; code: string; name: string }[]>>(
    '/plans/dropdown',
    {
      params: { intIncentiveId },
    },
  )

export const getPlanCycles = (planId: number) =>
  calculationService.get<BaseResponse<CommPlanCycleDropdown[]>>(`/plans/${planId}/cycles`)

