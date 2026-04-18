import type { BaseResponse } from '@/types/common'
import { plansService } from './_service-instance'
import { AxiosResponse } from "axios";

export type CommPlanResponse = {
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

export type SortField = {
  field: string
  direction: 'ASC' | 'DESC'
}

export type PlanSearchParams = {
  txtCode?: string
  txtName?: string
  intIncentiveId?: number
  intStatus?: number
  txtTransTypeCode?: string
  txtDocCode?: string
  sort?: string | string[] // Format: "field1:ASC,field2:DESC" or ["field1:ASC", "field2:DESC"]
  page?: number
  size?: number
}

export type PlanPageResponse = {
  success: boolean
  message?: string
  data: CommPlanResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// Step 1 Types
export type CommPlanCreateRequest = {
  planId?: number
  txtName: string
  intIncentiveId: number
  txtTransTypeCode: string
  intCycleDefId: number
  intCloseDay: number
  tCloseTime: string // HH:mm:ss
  intDayOfCycle?: number
  intVerifyNumber: number
  arrIncentiveId: number[]
  intProvisional?: number // 0 or 1
  intProvisionalInterval?: number
  dtEffectDate: string // DD/MM/YYYY
  dtExpireDate?: string // DD/MM/YYYY
  intTimePayout?: number
  intCycleStartDay?: number
  txtDescription?: string
}

export type CommPlanCreateResponse = {
  id: number
  txtCode: string
  planId: number
}

// Plan Detail Response
export type PlanDetailResponse = {
  planId: number
  txtCode: string
  txtName: string
  intIncentiveId: number
  txtTransTypeCode: string
  intCycleDefId: number
  intCloseDay: number
  tCloseTime: string // HH:mm:ss
  intDayOfCycle?: number | null
  intVerifyNumber: number
  arrIncentiveId: number[]
  intProvisional: number // 0 or 1
  intProvisionalInterval?: number
  dtEffectDate: string // DD/MM/YYYY
  dtExpireDate?: string | null // DD/MM/YYYY
  intTimePayout: number
  intCycleStartDay?: number | null
  txtDescription?: string
  intStatus: number
}

// Document Types
export type CommPlanDocumentRequest = {
  txtCode: string
  txtName: string
  dtPublishDate: string // DD/MM/YYYY
  fDocument: File
}

export type CommPlanDocumentResponse = {
  id: number
  txtCode: string
  txtName: string
  dtPublishDate: string
  createdAt?: string
  createdDateTime?: string
  hasContent?: boolean
}

export type CommPlanDocumentPageResponse = {
  success: boolean
  message?: string
  data: CommPlanDocumentResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type CycleDefDropdownItem = {
  id: number
  code: string
  name: string
  cycleType: number
}

// API Functions
export const fetchPlanList = (params?: PlanSearchParams) => {
  return plansService.get<PlanPageResponse>('', { params })
}

export const initializePlan = () => {
  return plansService.post<BaseResponse<CommPlanCreateResponse>>('/initialize')
}

export const copyPlan = (id: number) => {
  return plansService.post<BaseResponse<CommPlanCreateResponse>>(`/${id}/copy`)
}

export const updatePlanStep1 = (id: number, body: CommPlanCreateRequest) => {
  return plansService.put<BaseResponse<CommPlanCreateResponse>>(`/${id}/step1`, body)
}

export const updatePlanStatus = (id: number, status: number) => {
  return plansService.put<BaseResponse<CommPlanCreateResponse>>(`/${id}/status`, { intStatus: status })
}

export const approvePlan = (id: number) => {
  return plansService.put<BaseResponse<CommPlanCreateResponse>>(`/${id}/approve`)
}

export const cancelApproval = (id: number) => {
  return plansService.put<BaseResponse<CommPlanCreateResponse>>(`/${id}/cancel-approval`)
}

export const addDocument = (planId: number, formData: FormData) => {
  return plansService.post<BaseResponse<CommPlanDocumentResponse>>(
    `/${planId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}

export const getDocuments = (planId: number, page: number = 0, size: number = 10) => {
  return plansService.get<CommPlanDocumentPageResponse>(`/${planId}/documents`, {
    params: { page, size },
  })
}

export const deleteDocument = (planId: number, docId: number) => {
  return plansService.delete<BaseResponse<void>>(`/${planId}/documents/${docId}`)
}

export const downloadDocument = (
  planId: number,
  docId: number
): Promise<AxiosResponse<Blob>> => {
  return plansService.get(`/${planId}/documents/${docId}/download`,
    { responseType: 'blob' }
  )
}


export const getPlanById = (id: number) => {
  return plansService.get<BaseResponse<PlanDetailResponse>>(`/${id}`)
}

// Step 2 Types
export type PlanCriteriaRequest = {
  txtCriteria: number
  txtOperator: string
  txtValue: string
}

export type PlanVerifyRequest = {
  txtVerifyName: string
  dtVerifyEffectDate: string // DD/MM/YYYY
  dtVerifyExpireDate?: string | null // DD/MM/YYYY
  txtVerifyCondition: string
  criteriaList?: PlanCriteriaRequest[]
}

export type PlanVerifyResponse = {
  id: number
  planId: number
  txtVerifyName: string
  txtVerifyCondition: string
  dtVerifyEffectDate: string
  dtVerifyExpireDate: string | null
  txtDatetime: string
  txtCreator: string
  criteriaList: PlanCriteriaResponse[]
}

export type PlanCriteriaResponse = {
  id: number
  code: string
  criteria: string
  operator: string
  valueExpr: string
  inputDefVarId: number
}

export type CriteriaVariableResponse = {
  id: number
  code: string
  name: string
  elementType: string | null
  dataType: number | null
  defaultValue: string | null
  format: string | null
}

export type OperatorResponse = {
  id: number
  code: string
  name: string
  description: string | null
  priority: number | null
}

export type PlanVerifyPageResponse = {
  success: boolean
  message?: string
  data: PlanVerifyResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// Step 2 API Functions
export const getVerifyList = (planId: number, page: number = 1, size: number = 20) => {
  return plansService.get<PlanVerifyPageResponse>(`/${planId}/verifies`, {
    params: { page, size },
  })
}

export const getVerifyById = (planId: number, verifyId: number) => {
  return plansService.get<BaseResponse<PlanVerifyResponse>>(`/${planId}/verifies/${verifyId}`)
}

export const createVerify = (planId: number, body: PlanVerifyRequest) => {
  return plansService.post<BaseResponse<PlanVerifyResponse>>(`/${planId}/verifies`, body)
}

export const updateVerify = (planId: number, verifyId: number, body: PlanVerifyRequest) => {
  return plansService.put<BaseResponse<PlanVerifyResponse>>(`/${planId}/verifies/${verifyId}`, body)
}

export const deleteVerify = (planId: number, verifyId: number) => {
  return plansService.delete<BaseResponse<void>>(`/${planId}/verifies/${verifyId}`)
}

export const copyVerify = (planId: number, verifyId: number) => {
  return plansService.post<BaseResponse<PlanVerifyResponse>>(`/${planId}/verifies/${verifyId}/copy`)
}

export const getCriteriaVariables = (planId: number) => {
  return plansService.get<BaseResponse<CriteriaVariableResponse[]>>(`/${planId}/criteria-variables`)
}

export const getOperators = () => {
  return plansService.get<BaseResponse<OperatorResponse[]>>('/operators')
}

// Step 3 Types
export type PlanPriceRequest = {
  txtPriceName: string
  dtPriceEffectDate: string // DD/MM/YYYY
  dtPriceExpireDate?: string | null // DD/MM/YYYY
  intRateType?: number
  txtRate: string
  txtRateBy?: string | null
  arrFactor?: string[]
  txtPriceCondition?: string | null
  intTaxIncludedFlag?: number
  criteriaList?: PlanCriteriaRequest[]
}

export type PlanPriceResponse = {
  id: number
  planId: number
  txtPriceName: string
  dtPriceEffectDate: string
  dtPriceExpireDate: string | null
  intRateType: number
  txtRate: string
  txtRateBy: string | null
  arrFactor: string[] | null
  txtPriceCondition: string | null
  intTaxIncludedFlag: number
  txtDatetime: string
  txtCreator: string
  criteriaList: PlanCriteriaResponse[]
}

export type PlanPricePageResponse = {
  success: boolean
  message?: string
  data: PlanPriceResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// Step 3 API Functions
export const getPriceList = (planId: number, page: number = 1, size: number = 20) => {
  return plansService.get<PlanPricePageResponse>(`/${planId}/prices`, {
    params: { page, size },
  })
}

export const getPriceById = (planId: number, priceId: number) => {
  return plansService.get<BaseResponse<PlanPriceResponse>>(`/${planId}/prices/${priceId}`)
}

export const createPrice = (planId: number, body: PlanPriceRequest) => {
  return plansService.post<BaseResponse<PlanPriceResponse>>(`/${planId}/prices`, body)
}

export const updateVerifyCriteria = (
  planId: number,
  verifyId: number,
  criteriaId: number,
  body: PlanCriteriaRequest,
) => {
  return plansService.put<BaseResponse<void>>(
    `/${planId}/verifies/${verifyId}/criteria/${criteriaId}`,
    body,
  )
}

export const updatePrice = (planId: number, priceId: number, body: PlanPriceRequest) => {
  return plansService.put<BaseResponse<PlanPriceResponse>>(`/${planId}/prices/${priceId}`, body)
}

export const updatePriceCriteria = (
  planId: number,
  priceId: number,
  criteriaId: number,
  body: PlanCriteriaRequest,
) => {
  return plansService.put<BaseResponse<void>>(
    `/${planId}/prices/${priceId}/criteria/${criteriaId}`,
    body,
  )
}

export const deletePrice = (planId: number, priceId: number) => {
  return plansService.delete<BaseResponse<void>>(`/${planId}/prices/${priceId}`)
}

export const getRateByVariables = (planId: number) => {
  return plansService.get<BaseResponse<CriteriaVariableResponse[]>>(
    `/${planId}/price-rateby-variables`,
  )
}

export const getFactorVariables = (planId: number) => {
  return plansService.get<BaseResponse<CriteriaVariableResponse[]>>(
    `/${planId}/price-factor-variables`,
  )
}

// Step 4 Types
export type PlanPayeeResponse = {
  id: number
  planId: number
  txtOrganizationCode: string | null
  txtOrganizationName: string | null
  txtPayeeTypeId: number
  txtPayeeTypeName: string | null
  txtStatus: number
  txtCenterCode: string | null
  dtEffectDate: string
  dtExpireDate: string | null
  txtAssignDate: string
}

export type PlanPayeePageResponse = {
  success: boolean
  message?: string
  data: PlanPayeeResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type PlanPayeeAssignRequest = {
  txtOrganizationCode: string
  txtPayeeTypeIds: number[]
  dtEffectDate: string
  dtExpireDate?: string | null
}

export type PlanPayeeRevokeRequest = {
  ids: number[]
  dtExpireDate: string
}

export type PlanPayeeDraftItem = {
  txtOrganizationCode: string
  txtPayeeTypeId: number
  dtEffectDate: string
  dtExpireDate?: string | null
}

export type PlanPayeeDraftSubmitRequest = {
  items: PlanPayeeDraftItem[]
}

// Step 4 API Functions
export const getPlanPayeeList = (
  planId: number,
  params?: {
    txtOrganizationCode?: string
    txtPayeeTypeId?: number
    page?: number
    size?: number
  },
) => {
  return plansService.get<PlanPayeePageResponse>(`/${planId}/payees`, {
    params,
  })
}

export const assignPlanPayees = (planId: number, body: PlanPayeeAssignRequest) => {
  return plansService.post<BaseResponse<PlanPayeeResponse[]>>(
    `/${planId}/payees/assign`,
    body,
  )
}

export const revokePlanPayees = (planId: number, body: PlanPayeeRevokeRequest) => {
  return plansService.post<BaseResponse<void>>(`/${planId}/payees/revoke`, body)
}

export const getPlanPayeeDetail = (planId: number, id: number) => {
  return plansService.get<BaseResponse<PlanPayeeResponse>>(`/${planId}/payees/${id}`)
}

export const submitDraftPlanPayees = (planId: number, body: PlanPayeeDraftSubmitRequest) => {
  return plansService.put<BaseResponse<PlanPayeeResponse[]>>(`/${planId}/payees/draft-submit`, body)
}



