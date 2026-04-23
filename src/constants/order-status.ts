export type OrderStatusAction =
  | 'confirm'
  | 'reject'
  | 'handover'
  | 'complete'
  | 'deliveryFailed'
  | 'deliveryCancelled'
  | 'markReturned'

export const FULFILLMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ xử lý' },
  CONFIRMED: { color: 'blue', label: 'Đã xác nhận' },
  DELIVERY_ON_ROUTE: { color: 'geekblue', label: 'Đang giao hàng' },
  DELIVERY_COMPLETE: { color: 'green', label: 'Giao thành công' },
  DELIVERY_FAILED: { color: 'volcano', label: 'Giao thất bại' },
  DELIVERY_CANCELLED: { color: 'red', label: 'Thu hồi vận chuyển' },
  REJECTED: { color: 'magenta', label: 'Từ chối đơn' },
  RETURNED: { color: 'purple', label: 'Đã hoàn hàng' },
}

export const PAYMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  UNPAID: { color: 'orange', label: 'Chưa thanh toán' },
  PAYMENT_STARTED: { color: 'gold', label: 'Đang thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  PAYMENT_FAILED: { color: 'volcano', label: 'Thanh toán thất bại' },
  PAYMENT_CANCELLED: { color: 'red', label: 'Hủy thanh toán' },
  REFUND_PENDING: { color: 'processing', label: 'Đang hoàn tiền' },
  REFUNDED: { color: 'magenta', label: 'Đã hoàn tiền' },
  PARTIALLY_REFUNDED: { color: 'purple', label: 'Hoàn tiền một phần' },
}

export const FULFILLMENT_STATUS_OPTIONS = Object.entries(FULFILLMENT_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

export const FULFILLMENT_STATUS_PIPELINE = [
  'PENDING',
  'CONFIRMED',
  'DELIVERY_ON_ROUTE',
  'DELIVERY_COMPLETE',
]

export const TERMINAL_FULFILLMENT_STATUSES = ['DELIVERY_FAILED', 'DELIVERY_CANCELLED', 'REJECTED', 'RETURNED']

export const ACTIONS_BY_FULFILLMENT_STATUS: Record<string, OrderStatusAction[]> = {
  PENDING: ['confirm', 'reject'],
  CONFIRMED: ['handover'],
  DELIVERY_ON_ROUTE: ['complete', 'deliveryFailed', 'deliveryCancelled'],
  DELIVERY_COMPLETE: ['markReturned'],
  DELIVERY_FAILED: ['markReturned'],
  DELIVERY_CANCELLED: ['markReturned'],
}

const LEGACY_FULFILLMENT_ALIAS: Record<string, string> = {
  PAID_UNCONFIRMED: 'PENDING',
  PAID_CONFIRMED: 'CONFIRMED',
}

const LEGACY_PAYMENT_ALIAS: Record<string, string> = {
  PENDING: 'UNPAID',
  PAID_UNCONFIRMED: 'PAID',
  PAID_CONFIRMED: 'PAID',
}

export const normalizeFulfillmentStatus = (status?: string): string => {
  if (!status) return 'PENDING'
  const normalized = status.toUpperCase().replace(/[\s,]+/g, '_')
  return LEGACY_FULFILLMENT_ALIAS[normalized] ?? normalized
}

export const normalizePaymentStatus = (status?: string): string => {
  if (!status) return 'UNPAID'
  const normalized = status.toUpperCase().replace(/[\s,]+/g, '_')
  return LEGACY_PAYMENT_ALIAS[normalized] ?? normalized
}

export const getAvailableOrderActions = (
  fulfillmentStatus?: string,
  paymentStatus?: string,
): OrderStatusAction[] => {
  const f = normalizeFulfillmentStatus(fulfillmentStatus)
  const p = normalizePaymentStatus(paymentStatus)
  if (f === 'PENDING' && p !== 'PAID') {
    return []
  }
  return ACTIONS_BY_FULFILLMENT_STATUS[f] ?? []
}
