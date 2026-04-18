import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const returnService = createApiService(appApiIns, '/api/data/return-requests')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

// Backend: ReturnRequest.RefundMethod
export type RefundMethod = 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'BANK_TRANSFER'

// Backend: ReturnRequest.ReturnRequestStatus
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUND_PROCESSING' | 'REFUND_COMPLETED' | 'CANCELLED'

export type ReturnRequestItemPojo = {
  id?: number
  quantity?: number
  reason?: string
  isActive?: boolean
  productId?: number
  variantId?: number
  product?: {
    id?: number
    name?: string
    barcode?: string
    images?: { url: string }[]
  }
}

export type ReturnRequestPojo = {
  id?: number
  date?: string
  lastModified?: string
  reason?: string
  adminNotes?: string
  status?: ReturnStatus
  refundMethod?: RefundMethod
  refundAmount?: number
  trackingNumber?: string
  orderId?: number
  items?: ReturnRequestItemPojo[]
  // Enriched fields from joined entities
  order?: {
    id?: number
    date?: string
    recipientName?: string
    recipientPhone?: string
    totalValue?: number
    status?: string
  }
}

export type ReturnSearchParams = {
  status?: ReturnStatus
  orderId?: number
  page?: number
  size?: number
}

export type PageResponse<T> = {
  success: boolean
  message?: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────

export const searchReturns = (params: ReturnSearchParams) => {
  return returnService.get<PageResponse<ReturnRequestPojo[]>>('', { params })
}

export const getReturnById = (id: number) => {
  return returnService.get<ReturnRequestPojo>(`/${id}`)
}

export const approveReturn = (id: number) => {
  return returnService.post<ReturnRequestPojo>(`/approve/${id}`, {})
}

export const rejectReturn = (id: number, reason?: string) => {
  return returnService.post<ReturnRequestPojo>(`/reject/${id}`, { reason })
}

export const receiveReturn = (id: number) => {
  return returnService.post<ReturnRequestPojo>(`/receive/${id}`, {})
}

export const startRefundProcessing = (id: number) => {
  return returnService.post<ReturnRequestPojo>(`/start-refund/${id}`, {})
}

export const completeRefund = (id: number) => {
  return returnService.post<ReturnRequestPojo>(`/complete-refund/${id}`, {})
}

export const cancelReturn = (id: number, reason?: string) => {
  return returnService.post<ReturnRequestPojo>(`/cancel/${id}`, { reason })
}

export const addTrackingNumber = (id: number, trackingNumber: string) => {
  return returnService.post<ReturnRequestPojo>(`/tracking/${id}`, { trackingNumber })
}

export const updateReturnNotes = (id: number, adminNotes: string) => {
  return returnService.post<ReturnRequestPojo>(`/notes/${id}`, { adminNotes })
}
