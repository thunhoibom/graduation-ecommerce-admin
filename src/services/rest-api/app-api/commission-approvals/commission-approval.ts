import type { BaseResponse, PageResponse } from '@/types/common'
import { commissionApprovalsService } from './_service-instance'
import { commissionScopedService } from './_scoped-service-instance'

/**
 * API màn Duyệt chi phí – mapping theo SCREEN_MAPPING_COMMISSION_APPROVAL.md.
 */

export type CommissionApprovalResponse = {
  id: number
  month?: string
  payeeId?: number
  /** Mã / tên đối tượng – từ API (comm_payee). */
  payeeCode?: string
  payeeName?: string
  incentiveId?: number
  /** Mã / tên khoản mục – từ API (comm_incentive). */
  incentiveCode?: string
  incentiveName?: string
  /** Loại chu kỳ – từ API (comm_cycle_def qua comm_plan_cycle). */
  cycleDefName?: string
  verifyNumber?: number
  productCode?: string
  vehiclePlate?: string
  etagNumber?: string
  orgTransId?: number
  transDatetime?: string
  saleAmount?: number
  commRateType?: number
  /** Tên loại đơn giá – map từ COMM_RATE_TYPE (1 %, 2 fixed, 3 bậc thang). */
  commRateTypeName?: string
  commRate?: number
  commAmount?: number
  approveStatus?: number | null
  approveUser?: string
  approveDatetime?: string
  approveReason?: string
  approveReasonName?: string
  description?: string
  issueDatetime?: string
  /** NV tính – user_name */
  userName?: string
  /** Trạng thái TB: -1,0,1,2,3 */
  status?: number
  /** Trạng thái TT: 0, 1 */
  payoutStatus?: number
  /** Điều kiện xét duyệt: 0 Không đạt, 1 Đạt (verify) */
  verify?: number
  reason?: string
  reasonName?: string
  transCode?: string
  payeeRefCode?: string
  payeeTypeCode?: string
  payeeTypeName?: string
}

export type CommissionApprovalSearchParams = {
  monthFrom?: string
  monthTo?: string
  incentiveId?: number
  cycle?: number
  payeeNameOrCode?: string
  organizationId?: number
  payeeId?: number
  payeeIds?: number[]
  transDateFrom?: string
  transDateTo?: string
  approveStatus?: number
  planId?: number
  page?: number
  size?: number

  /** Trạng thái TB: -1,0,1,2,3. */
  status?: number
  /** Trạng thái TT: -1 Chưa lập hồ sơ (NULL), 0 Chờ thanh toán, 1 Đã thanh toán. */
  payoutStatus?: number
  /** Thời gian tính từ/đến (issue_datetime). */
  issueDateFrom?: string
  issueDateTo?: string
  /** NV tính (user_name). */
  userName?: string
  verify?: number
  etagNumber?: string
  incentiveGrpCode?: string
  payeeTypeId?: number
  payeeTypeCode?: string
}

const normalizeCommissionApprovalParams = (params: CommissionApprovalSearchParams) => ({
  ...params,
  payeeIds: params.payeeIds?.join(','),
})

export type CommissionApprovalPaymentSearchParams = {
  monthFrom?: string
  monthTo?: string
  incentiveIds?: number[]
  payeeIds?: number[]
  payMonth?: string
  paymentRequestId?: number
}

export type ReasonDropdownResponse = {
  id: number
  reasonCode: string
  reasonName: string
}

/** Đơn vị – từ bảng comm_organization (COMM_DB_DESIGN Stan56) */
export type OrganizationDropdownResponse = {
  id: number
  organizationCode?: string
  organizationName?: string
}

export type ApproveRequest = {
  commissionIds: number[]
}

export type RejectRequest = {
  commissionIds: number[]
  reasonCode: string
  note?: string
}

export type CancelApproveRequest = {
  commissionIds: number[]
}

export type ImportApprovalResult = {
  countUpdated: number
  errors: string[]
}

export type CommissionAdjustmentAddRequest = {
  month: string
  payeeId: number
  incentiveId: number
  amount: number
  adjustmentDate: string
  reasonCode: string
  description?: string
}

export type CommissionAdjustmentUpdateRequest = {
  commissionId: number
  amount: number
  adjustmentDate: string
  reasonCode: string
}

export type ImportAdjustmentResult = {
  total: number
  success: number
  failed: number
  errorFile?: any // byte[] but will be handled as part of response
  errorFileName?: string
}

export const searchCommissionApprovals = (
  params: CommissionApprovalSearchParams,
): Promise<PageResponse<CommissionApprovalResponse>> =>
  commissionApprovalsService.get<PageResponse<CommissionApprovalResponse>>('', {
    params: normalizeCommissionApprovalParams(params),
  })

/** Tìm kiếm chi phí theo phạm vi đơn vị của user đăng nhập (màn Tra cứu / Duyệt chi phí) */
export const searchCommissionApprovalsScoped = (
  params: CommissionApprovalSearchParams,
): Promise<PageResponse<CommissionApprovalResponse>> =>
  commissionScopedService.get<PageResponse<CommissionApprovalResponse>>('', {
    params: normalizeCommissionApprovalParams(params),
  })

/** Xuất file Excel chi phí theo phạm vi đơn vị */
export const exportCommissionApprovalsScoped = async (
  params: Omit<CommissionApprovalSearchParams, 'page' | 'size'>,
): Promise<Blob> => {
  const response = await commissionScopedService.get<Blob>('/export', {
    params: normalizeCommissionApprovalParams(params),
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

/** Danh sách đơn vị từ bảng comm_organization – dropdown Đơn vị */
export const getCommissionApprovalOrganizations = (): Promise<
  BaseResponse<OrganizationDropdownResponse[]>
> =>
  commissionApprovalsService.get<BaseResponse<OrganizationDropdownResponse[]>>(
    '/organizations',
  )

import { getPayeeTypeDropdown, type PayeeTypeDropdownItem } from '../payee-types/payee-type'

export type PayeeTypeDropdownResponse = PayeeTypeDropdownItem

export const getRejectReasons = (): Promise<
  BaseResponse<ReasonDropdownResponse[]>
> =>
  commissionApprovalsService.get<BaseResponse<ReasonDropdownResponse[]>>(
    '/reasons',
  )

export const getCommissionApprovalPayeeTypes = (): Promise<
  BaseResponse<PayeeTypeDropdownResponse[]>
> =>
  commissionApprovalsService.get<BaseResponse<PayeeTypeDropdownResponse[]>>(
    '/payee-types',
  )

export const approveCommissionApprovals = (
  body: ApproveRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<number>> =>
  commissionApprovalsService.post<BaseResponse<number>>('/approve', body, {
    headers,
  })

export const rejectCommissionApprovals = (
  body: RejectRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<number>> =>
  commissionApprovalsService.post<BaseResponse<number>>('/reject', body, {
    headers,
  })

export const cancelApproveCommissionApprovals = (
  body: CancelApproveRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<number>> =>
  commissionApprovalsService.post<BaseResponse<number>>('/cancel-approve', body, {
    headers,
  })

export const exportCommissionApprovals = async (
  params: Omit<CommissionApprovalSearchParams, 'page' | 'size'>,
): Promise<Blob> => {
  const response = await commissionApprovalsService.get<Blob>('/export', {
    params: normalizeCommissionApprovalParams(params),
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const exportCommissionAdjustments = async (
  params: Omit<CommissionApprovalSearchParams, 'page' | 'size'>,
): Promise<Blob> => {
  const response = await commissionApprovalsService.get<Blob>('/export-adjustments', {
    params: normalizeCommissionApprovalParams(params),
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const importCommissionApprovals = (
  file: File,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ImportApprovalResult>> => {
  const formData = new FormData()
  formData.append('file', file)
  return commissionApprovalsService.post<BaseResponse<ImportApprovalResult>>(
    '/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...headers,
      },
    },
  )
}

export const downloadAdjustmentTemplate = async (): Promise<Blob> => {
  const response = await commissionApprovalsService.get<Blob>(
    '/adjustments-template',
    {
      responseType: 'blob',
    },
  )
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const importCommissionAdjustments = (
  file: File,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ImportAdjustmentResult>> => {
  const formData = new FormData()
  formData.append('file', file)
  return commissionApprovalsService.post<BaseResponse<ImportAdjustmentResult>>(
    '/import-adjustments',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...headers,
      },
    },
  )
}

export const addCommissionAdjustment = (
  body: CommissionAdjustmentAddRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<void>> =>
  commissionApprovalsService.post<BaseResponse<void>>('/add-adjustment', body, {
    headers,
  })

export const updateCommissionAdjustment = (
  body: CommissionAdjustmentUpdateRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<void>> =>
  commissionApprovalsService.put<BaseResponse<void>>('/adjustments', body, {
    headers,
  })

export const deleteCommissionAdjustments = (
  commissionIds: number[],
): Promise<BaseResponse<void>> =>
  commissionApprovalsService.delete<BaseResponse<void>>('/adjustments', {
    data: commissionIds,
  })

