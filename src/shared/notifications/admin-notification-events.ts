export const NEW_ORDER_RECEIVED_EVENT = 'admin:new-order-received'

export type NewOrderNotificationPayload = {
  eventId?: string
  type: 'order.created'
  orderId: number
  orderCode: string
  createdAt: string
  totalAmount: number
  status: string
  previewImageUrl?: string
}

export const emitNewOrderReceived = (payload: NewOrderNotificationPayload) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<NewOrderNotificationPayload>(NEW_ORDER_RECEIVED_EVENT, { detail: payload }),
  )
}

export const addNewOrderListener = (
  listener: (payload: NewOrderNotificationPayload) => void,
) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NewOrderNotificationPayload>
    if (customEvent.detail) {
      listener(customEvent.detail)
    }
  }

  window.addEventListener(NEW_ORDER_RECEIVED_EVENT, handler)
  return () => window.removeEventListener(NEW_ORDER_RECEIVED_EVENT, handler)
}
