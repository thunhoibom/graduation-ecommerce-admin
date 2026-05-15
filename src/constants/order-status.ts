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
  PROCESSING: { color: 'cyan', label: 'Đang chuẩn bị hàng' },
  READY_TO_PICK: { color: 'geekblue', label: 'Chờ shipper lấy hàng' },
  PICKED_UP: { color: 'purple', label: 'Shipper đã lấy hàng' },
  DELIVERING: { color: 'geekblue', label: 'Đang giao hàng' },
  DELIVERED: { color: 'green', label: 'Đã giao thành công' },
  COMPLETED: { color: 'lime', label: 'Hoàn tất' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
  DELIVERY_FAILED: { color: 'volcano', label: 'Giao thất bại' },
  REJECTED: { color: 'magenta', label: 'Từ chối đơn' },
  RETURNED: { color: 'purple', label: 'Đã hoàn hàng' },
}

export const PAYMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  UNPAID: { color: 'orange', label: 'Chưa thanh toán' },
  PAYMENT_STARTED: { color: 'gold', label: 'Đang thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  PAYMENT_FAILED: { color: 'volcano', label: 'Thanh toán thất bại' },
  EXPIRED: { color: 'red', label: 'Hết hạn thanh toán' },
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
  'PROCESSING',
  'READY_TO_PICK',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'COMPLETED',
]

export const TERMINAL_FULFILLMENT_STATUSES = ['COMPLETED', 'CANCELLED', 'DELIVERY_FAILED', 'REJECTED', 'RETURNED']

export const ACTIONS_BY_FULFILLMENT_STATUS: Record<string, OrderStatusAction[]> = {
  PENDING: ['confirm', 'reject'],
  CONFIRMED: ['handover'],
  PROCESSING: ['handover'],
  READY_TO_PICK: ['handover'],
  PICKED_UP: ['handover'],
  DELIVERING: ['complete', 'deliveryCancelled'],
  DELIVERED: ['markReturned'],
  CANCELLED: ['markReturned'],
}

const LEGACY_FULFILLMENT_ALIAS: Record<string, string> = {
  PAID_UNCONFIRMED: 'PENDING',
  PAID_CONFIRMED: 'PROCESSING',
  DELIVERY_ON_ROUTE: 'DELIVERING',
  DELIVERY_COMPLETE: 'DELIVERED',
  DELIVERY_CANCELLED: 'CANCELLED',
}

const LEGACY_PAYMENT_ALIAS: Record<string, string> = {
  PENDING: 'UNPAID',
  PAID_UNCONFIRMED: 'PAID',
  PAID_CONFIRMED: 'PAID',
  PAYMENT_CANCELLED: 'EXPIRED',
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

/**
 * Backward-compatible normalizer used by older dashboard widgets
 * that consume a mixed status stream (payment + fulfillment).
 */
export const normalizeOrderStatus = (status?: string): string => {
  const normalized = status?.toUpperCase().replace(/[\s,]+/g, '_')
  if (!normalized) return 'PENDING'

  if (normalized in PAYMENT_STATUS_CONFIG || normalized in LEGACY_PAYMENT_ALIAS) {
    return normalizePaymentStatus(normalized)
  }

  return normalizeFulfillmentStatus(normalized)
}

export const getAvailableOrderActions = (
  fulfillmentStatus?: string,
  paymentStatus?: string,
  paymentType?: string,
): OrderStatusAction[] => {
  const f = normalizeFulfillmentStatus(fulfillmentStatus)
  const p = normalizePaymentStatus(paymentStatus)
  const normalizedPaymentType = paymentType?.trim().toUpperCase()
  const isCodAwaitingCollection = normalizedPaymentType === 'COD' && p === 'UNPAID'
  if (f === 'PENDING' && p !== 'PAID' && !isCodAwaitingCollection) {
    return []
  }
  return ACTIONS_BY_FULFILLMENT_STATUS[f] ?? []
}
