import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const returnService = createApiService(appApiIns, '/api/data/return-requests')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ReturnRequestItemPojo = {
  id?: number
  quantity?: number
  reason?: string
  returnPrice?: number
}

export type ReturnRequestPojo = {
  id?: number
  date?: string
  lastModified?: string
  reason?: string
  adminNotes?: string
  status?: string   // PENDING, APPROVED, REJECTED, RECEIVED, COMPLETED, CANCELLED
  refundMethod?: string
  refundAmount?: number
  trackingNumber?: string
  orderId?: number
  items?: ReturnRequestItemPojo[]
}

export type ReturnSearchParams = {
  status?: string
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

export const completeRefund = (id: number) => {
  return returnService.post<ReturnRequestPojo>(`/complete-refund/${id}`, {})
}

export const cancelReturn = (id: number, reason?: string) => {
  return returnService.post<ReturnRequestPojo>(`/cancel/${id}`, { reason })
}

export const addTrackingNumber = (id: number, trackingNumber: string) => {
  return returnService.post<ReturnRequestPojo>(`/tracking/${id}`, { trackingNumber })
}
