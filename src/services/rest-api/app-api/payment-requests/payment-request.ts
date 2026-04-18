import type { BaseResponse, PageResponse } from '@/types/common'
import { paymentRequestsService } from './_service-instance'
import type { CommissionApprovalPaymentSearchParams } from '../commission-approvals/commission-approval'

export type PaymentRequestSummary = {
  id: number
  code: string
  name: string
  organizationCode: string
  organizationName: string
  payeeGroup?: number // 1=INDIVIDUAL, 2=AGENCY
  amount: number
  noVatAmount: number
  vatAmount: number
  tax: number
  status: number
  payStatus: number
  payMonth: string
  createdDateTime: string
  userName: string
  userFullName?: string
  saleApprovalId?: number
  saleApprovalName?: string
  saleApprovalStatus?: number
  hrApprovalId?: number
  hrApprovalName?: string
  hrApprovalStatus?: number
  accountApprovalId?: number
  accountApprovalName?: string
  accountApprovalStatus?: number
  saleApprovalDescription?: string
  hrApprovalDescription?: string
  accountApprovalDescription?: string
  extraData?: {
    fromMonth?: string
    toMonth?: string
    payeeGroup?: string
    payeeTypeCode?: string
    incentiveIds?: number[]
    payeeIds?: number[]
    payeeId?: (string | number)[]
    incentiveId?: number[]
  }
  payees?: PayeeDetail[]
}

export type PayeeDetail = {
  id: number
  payeeId: number
  payeeName: string
  payeeTypeName: string
  payeeGroup?: number // 1=INDIVIDUAL, 2=AGENCY
  amount: number      // SAU THUẾ
  noVatAmount: number // TRƯỚC THUẾ
  vatAmount: number
  payStatus?: number
  payStatusName?: string
  items: ItemDetail[]
}

export type ItemDetail = {
  id: number
  incentiveId: number
  incentiveName: string
  month: string
  amount: number      // SAU THUẾ
  noVatAmount: number // TRƯỚC THUẾ
  taxRate: number
  taxAmount: number
}

export type PaymentRequestSearchParams = {
  code?: string
  name?: string
  organizationCode?: string
  payeeId?: string | number
  payeeTypeCode?: string
  status?: string | number
  payStatus?: string | number
  fromMonth?: string
  toMonth?: string
  sortField?: string
  sortDirection?: string
  page?: string | number
  size?: string | number
}

export type IncentiveItemRequest = {
  incentiveId: number
  month: string
  amount: number
  vatAmount: number
  taxRate?: number
}

export type PayeeProfileRequest = {
  payeeId: number
  amount: number
  vatAmount: number
  taxRate?: number
  items: IncentiveItemRequest[]
}

export type PaymentRequestCreateRequest = {
  name: string
  organizationCode: string
  organizationName: string
  payeeGroup: string
  payMonth: string
  saleApprovalId?: number
  hrApprovalId?: number
  accountApprovalId?: number
  isSubmit?: boolean
  payeeIds: number[]
  payees: PayeeProfileRequest[]
  extraData?: {
    fromMonth?: string
    toMonth?: string
    payeeGroup?: string
    payeeTypeCode?: string
    incentiveIds?: number[]
    payeeIds?: number[]
    payeeId?: (string | number)[]
    incentiveId?: number[]
  }
}

// ─── Response từ BE đã gom nhóm ───────────────────────────────────────────

export type CommissionGroupItem = {
  incentiveId: number
  incentiveCode: string | null
  incentiveName: string | null
  month: string
  monthLabel: string
  amount: number       // SAU THUẾ
  noVatAmount: number  // TRƯỚC THUẾ
  taxRate: number
  taxAmount: number
}

export type PayeeGroupItem = {
  profileId?: number
  payeeId: number
  payeeCode: string | null
  payeeName: string | null
  payeeType: string | null
  taxCode?: string | null
  amount: number       // SAU THUẾ
  noVatAmount: number  // TRƯỚC THUẾ
  vatAmount: number
  taxRate: number
  payeeGroup?: number
  payStatus?: number
  payStatusName?: string
  items: CommissionGroupItem[]
}

export type PaymentRequestCommissionGroupResponse = {
  payees: PayeeGroupItem[]
  totalNoVatAmount: number
  totalVatAmount: number
  totalAmount: number
  payeeCount: number
}

export const searchPaymentRequests = async (
  params: PaymentRequestSearchParams,
): Promise<PageResponse<PaymentRequestSummary>> => {
  return paymentRequestsService.get<PageResponse<PaymentRequestSummary>>('', { params })
}

export const searchPaymentRequestsForPayout = async (
  params: PaymentRequestSearchParams,
): Promise<PageResponse<PaymentRequestSummary>> => {
  return paymentRequestsService.get<PageResponse<PaymentRequestSummary>>('/for-payout', { params })
}

export const createPaymentRequest = async (
  body: PaymentRequestCreateRequest,
): Promise<BaseResponse<PaymentRequestSummary>> => {
  return paymentRequestsService.post<BaseResponse<PaymentRequestSummary>>('', body)
}

/** BE gom nhóm rồi, FE chỉ hiển thị. */
export const searchCommissionForPaymentRequest = (
  body: CommissionApprovalPaymentSearchParams,
): Promise<BaseResponse<PaymentRequestCommissionGroupResponse>> =>
  paymentRequestsService.post<BaseResponse<PaymentRequestCommissionGroupResponse>>(
    '/search-commissions',
    body,
  )

export const getPaymentRequestDetail = async (
  id: number,
): Promise<BaseResponse<PaymentRequestSummary>> => {
  return paymentRequestsService.get<BaseResponse<PaymentRequestSummary>>(`/${id}`)
}

export const updatePaymentRequest = async (
  id: number,
  body: PaymentRequestCreateRequest,
): Promise<BaseResponse<PaymentRequestSummary>> => {
  return paymentRequestsService.put<BaseResponse<PaymentRequestSummary>>(`/${id}`, body)
}

export const deletePaymentRequest = async (
  id: number,
): Promise<BaseResponse<void>> => {
  return paymentRequestsService.delete<BaseResponse<void>>(`/${id}`)
}

export const exportPaymentRequestDetail = async (
  body: CommissionApprovalPaymentSearchParams,
): Promise<Blob> => {
  const response = await paymentRequestsService.post<Blob>('/export-detail', body, {
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const exportPaymentRequestDetailById = async (
  id: number,
): Promise<Blob> => {
  const response = await paymentRequestsService.get<Blob>(`/${id}/export-detail`, {
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const exportPaymentRequestSummaryById = async (
  id: number,
): Promise<Blob> => {
  const response = await paymentRequestsService.get<Blob>(`/${id}/export-summary`, {
    responseType: 'blob',
  })
  const raw = response as unknown
  return raw instanceof Blob ? raw : (raw as { data: Blob }).data
}

export const approvePaymentRequest = async (id: number): Promise<BaseResponse<void>> =>
  paymentRequestsService.post<BaseResponse<void>>('/approve', { paymentRequestId: id })

export const rejectPaymentRequest = async (id: number, reason?: string): Promise<BaseResponse<void>> =>
  paymentRequestsService.post<BaseResponse<void>>('/reject', { paymentRequestId: id, reason })

export const payPaymentRequest = async (id: number, profileIds: number[]): Promise<BaseResponse<void>> =>
  paymentRequestsService.post<BaseResponse<void>>(`/pay/${id}`, profileIds)
