import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const financeService = createApiService(appApiIns, '/api/admin/finance')

export type FinancePaymentItem = {
  orderId: number
  transactionToken?: string
  gateway?: string
  orderStatus?: string
  paymentStatus?: string
  orderTotal: number
  totalRefundedAmount?: number
  callbackResult?: string
  callbackAuthorizedAmount?: number
  processedAt?: string
}

export type FinanceRefundOperationItem = {
  returnRequestId: number
  orderId: number
  status: string
  refundAmount?: number
  refundedAmountToDate: number
  refundMethod?: string
  reason?: string
  adminNotes?: string
  lastModified?: string
}

export type FinanceRefundRetryItem = {
  queueId: number
  orderId: number
  transactionToken?: string
  amount: number
  reason?: string
  status: string
  attemptCount: number
  failedAttempts: number
  nextRetryAt?: string
  lastError?: string
  updatedAt?: string
}

export type FinanceCallbackLogItem = {
  id: number
  orderId: number
  token: string
  result: string
  orderStatusAfter?: string
  authorizedAmount?: number
  processedAt?: string
}

export type FinanceReconciliationMismatchItem = {
  mismatchKey: string
  orderId: number
  orderStatus?: string
  paymentStatus?: string
  orderTotal?: number
  transactionToken?: string
  type: string
  description: string
  severity: string
  resolved: boolean
  resolutionNote?: string
  resolvedBy?: string
  resolvedAt?: string
}

export type FinanceReconciliationSummary = {
  grossPaidAmount: number
  refundAmount: number
  netAmount: number
  failedPaymentCount: number
  unresolvedMismatchCount: number
}

export type DataPageResponse<T> = {
  items: T[]
  pageIndex: number
  totalCount: number
  pageSize: number
}

export type FinancePagingParams = {
  page?: number
  size?: number
}

export const getFinancePayments = (
  params: FinancePagingParams & {
    orderId?: number
    paymentStatus?: string
    orderStatus?: string
    from?: string
    to?: string
  },
) => financeService.get<DataPageResponse<FinancePaymentItem>>('/payments', { params })

export const getFinanceRefunds = (
  params: FinancePagingParams & {
    orderId?: number
    status?: string
    from?: string
    to?: string
  },
) => financeService.get<DataPageResponse<FinanceRefundOperationItem>>('/refunds', { params })

export const getFinanceRefundRetries = (
  params: FinancePagingParams & {
    orderId?: number
    status?: string
  },
) => financeService.get<DataPageResponse<FinanceRefundRetryItem>>('/refund-retries', { params })

export const triggerManualRefundRetry = (id: number) =>
  financeService.post<FinanceRefundRetryItem>(`/refund-retries/${id}/manual-retry`, {})

export const getFinanceCallbackLogs = (
  params: FinancePagingParams & {
    orderId?: number
    result?: string
    from?: string
    to?: string
  },
) => financeService.get<DataPageResponse<FinanceCallbackLogItem>>('/payment-callback-logs', { params })

export const getFinanceReconciliationSummary = (params: { from?: string; to?: string }) =>
  financeService.get<FinanceReconciliationSummary>('/reconciliation/summary', { params })

export const getFinanceReconciliationMismatches = (
  params: FinancePagingParams & {
    from?: string
    to?: string
    resolved?: boolean
  },
) => financeService.get<DataPageResponse<FinanceReconciliationMismatchItem>>('/reconciliation/mismatches', { params })

export const resolveFinanceMismatch = (mismatchKey: string, note?: string) =>
  financeService.post<{ success: boolean }>(`/reconciliation/mismatches/${mismatchKey}/resolve`, { note })

export const exportFinanceSettlementCsv = (params: { from?: string; to?: string }) =>
  appApiIns.get<Blob>('/api/admin/finance/reconciliation/settlement-export', {
    params,
    responseType: 'blob',
  })
