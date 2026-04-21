export type OrderStatusAction =
  | 'confirm'
  | 'reject'
  | 'handover'
  | 'complete'
  | 'deliveryFailed'
  | 'deliveryCancelled'
  | 'markReturned'

export const ORDER_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ thanh toán' },
  PAYMENT_STARTED: { color: 'gold', label: 'Đang thanh toán' },
  PAYMENT_FAILED: { color: 'volcano', label: 'Thanh toán thất bại' },
  PAYMENT_CANCELLED: { color: 'red', label: 'Hủy thanh toán' },
  PAID_UNCONFIRMED: { color: 'cyan', label: 'Đã thanh toán, chờ duyệt' },
  PAID_CONFIRMED: { color: 'blue', label: 'Đã duyệt đơn' },
  DELIVERY_ON_ROUTE: { color: 'geekblue', label: 'Đang giao hàng' },
  DELIVERY_COMPLETE: { color: 'green', label: 'Giao thành công' },
  DELIVERY_FAILED: { color: 'volcano', label: 'Giao thất bại' },
  DELIVERY_CANCELLED: { color: 'red', label: 'Thu hồi vận chuyển' },
  REJECTED: { color: 'magenta', label: 'Từ chối đơn' },
  RETURNED: { color: 'purple', label: 'Đã hoàn hàng' },
}

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

export const ORDER_STATUS_PIPELINE = [
  'PENDING',
  'PAYMENT_STARTED',
  'PAID_UNCONFIRMED',
  'PAID_CONFIRMED',
  'DELIVERY_ON_ROUTE',
  'DELIVERY_COMPLETE',
]

export const TERMINAL_ORDER_STATUSES = ['PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'REJECTED', 'RETURNED']

export const ACTIONS_BY_STATUS: Record<string, OrderStatusAction[]> = {
  PAID_UNCONFIRMED: ['confirm', 'reject'],
  PAID_CONFIRMED: ['handover'],
  DELIVERY_ON_ROUTE: ['complete', 'deliveryFailed', 'deliveryCancelled'],
  DELIVERY_COMPLETE: ['markReturned'],
  DELIVERY_FAILED: ['markReturned'],
  DELIVERY_CANCELLED: ['markReturned'],
}

export const normalizeOrderStatus = (status?: string): string => {
  if (!status) return 'PENDING'
  return status.toUpperCase().replace(/[\s,]+/g, '_')
}
