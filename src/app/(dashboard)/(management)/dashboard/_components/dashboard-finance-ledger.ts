import dayjs from 'dayjs'
import type {
  FinancePaymentItem,
  FinanceRefundOperationItem,
} from '@/services/rest-api/app-api/finance/finance-service'

export type FinanceLedgerDirection = 'IN' | 'OUT'

export type FinanceLedgerEntry = {
  key: string
  occurredAt?: string
  direction: FinanceLedgerDirection
  category: string
  source: string
  amount: number
  status: string
  orderId?: number
  returnRequestId?: number
  reference?: string
  note?: string
}

const REFUND_METHOD_LABELS: Record<string, string> = {
  ORIGINAL_PAYMENT: 'Hoàn qua cổng thanh toán',
  STORE_CREDIT: 'Ví cửa hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  RECEIVED: 'Đã nhận hàng',
  REFUND_PROCESSING: 'Đang hoàn tiền',
  REFUND_COMPLETED: 'Hoàn tiền xong',
  CANCELLED: 'Đã hủy',
}

export const getRefundMethodLabel = (value?: string) =>
  value ? REFUND_METHOD_LABELS[value] ?? value : 'Trả hàng'

export const getRefundStatusLabel = (value?: string) =>
  value ? REFUND_STATUS_LABELS[value] ?? value : '—'

export const buildFinanceLedger = (
  payments: FinancePaymentItem[],
  refunds: FinanceRefundOperationItem[],
): FinanceLedgerEntry[] => {
  const paymentRows: FinanceLedgerEntry[] = payments
    .filter((payment) => payment.paymentStatus === 'SUCCESS')
    .map((payment) => ({
      key: `payment-${payment.orderId}-${payment.transactionToken ?? payment.processedAt ?? 'unknown'}`,
      occurredAt: payment.processedAt,
      direction: 'IN',
      category: 'Thu thanh toán đơn hàng',
      source: payment.gateway ?? 'Đơn hàng',
      amount: payment.orderTotal ?? 0,
      status: payment.paymentStatus ?? 'SUCCESS',
      orderId: payment.orderId,
      reference: payment.transactionToken,
      note: payment.callbackResult ? `Callback: ${payment.callbackResult}` : undefined,
    }))

  const refundRows: FinanceLedgerEntry[] = refunds
    .filter((refund) => (refund.refundAmount ?? 0) > 0)
    .map((refund) => ({
      key: `refund-${refund.returnRequestId}`,
      occurredAt: refund.lastModified,
      direction: 'OUT',
      category:
        refund.status === 'REFUND_COMPLETED'
          ? 'Hoàn tiền cho khách'
          : 'Hoàn tiền chờ chi',
      source: getRefundMethodLabel(refund.refundMethod),
      amount: refund.refundAmount ?? 0,
      status: refund.status,
      orderId: refund.orderId,
      returnRequestId: refund.returnRequestId,
      reference: refund.returnRequestId ? `RR-${refund.returnRequestId}` : undefined,
      note: refund.reason ?? refund.adminNotes,
    }))

  return [...paymentRows, ...refundRows].sort((left, right) => {
    const leftTime = left.occurredAt ? dayjs(left.occurredAt).valueOf() : 0
    const rightTime = right.occurredAt ? dayjs(right.occurredAt).valueOf() : 0
    return rightTime - leftTime
  })
}
