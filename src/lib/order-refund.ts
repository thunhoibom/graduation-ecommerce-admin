import { normalizeFulfillmentStatus, normalizePaymentStatus } from '@/constants/order-status'

export type OrderRefundSnapshot = {
  fulfillmentStatus?: string
  status?: string
  paymentStatus?: string
  totalRefundedAmount?: number
  totalValue?: number
  netValue?: number
}

const RETURN_ELIGIBLE_FULFILLMENT = new Set(['DELIVERED', 'COMPLETED', 'CANCELLED'])

export const getOrderRefundedAmount = (order: OrderRefundSnapshot): number =>
  Math.max(0, order.totalRefundedAmount ?? 0)

export const getOrderTotalAmount = (order: OrderRefundSnapshot): number =>
  Math.max(0, order.totalValue ?? order.netValue ?? 0)

export const getOrderNetAmount = (order: OrderRefundSnapshot): number =>
  Math.max(0, getOrderTotalAmount(order) - getOrderRefundedAmount(order))

export const resolveOrderPaymentStatus = (order: OrderRefundSnapshot): string => {
  const refunded = getOrderRefundedAmount(order)
  const total = getOrderTotalAmount(order)
  if (refunded > 0) {
    if (total > 0 && refunded >= total) return 'REFUNDED'
    return 'PARTIALLY_REFUNDED'
  }
  return normalizePaymentStatus(order.paymentStatus)
}

export const isOrderFullyRefunded = (order: OrderRefundSnapshot): boolean => {
  const refunded = getOrderRefundedAmount(order)
  if (refunded <= 0) return false
  if (resolveOrderPaymentStatus(order) === 'REFUNDED') return true
  const total = getOrderTotalAmount(order)
  return total > 0 && refunded >= total
}

export const canCustomerRequestReturn = (order: OrderRefundSnapshot): boolean => {
  const fulfillment = normalizeFulfillmentStatus(order.fulfillmentStatus ?? order.status)
  if (!RETURN_ELIGIBLE_FULFILLMENT.has(fulfillment)) return false
  return !isOrderFullyRefunded(order)
}
