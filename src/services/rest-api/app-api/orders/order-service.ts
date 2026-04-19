import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'
import { ProductVariantPojo } from '../products/product-service'

const orderService = createApiService(appApiIns, '/api/data/orders')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Shared / Referenced Pojos
// ─────────────────────────────────────────────────────────────────

export type AddressPojo = {
  id?: number
  name?: string
  phone?: string
  email?: string
  address1?: string
  address2?: string
  ward?: string
  district?: string
  city?: string
  country?: string
}

export type BillingCompanyPojo = {
  id?: number
  name?: string
  taxCode?: string
  address?: string
}

export type PersonPojo = {
  id?: number
  firstName?: string
  lastName?: string
  email: string
  phone1?: string
  phone2?: string
  idNumber?: string
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type OrderDetailPojo = {
  id?: number
  units: number
  unitValue: number
  description?: string
  product?: ProductPojo
  variantId?: number
  variant?: ProductVariantPojo
}

export type ProductPojo = {
  id?: number
  name: string
  barcode: string
  description?: string
  price: number
  currentStock?: number
  images?: { url?: string }[]
}

export type OrderPojo = {
  // Core identity
  id?: number
  buyOrder?: number
  cartSessionToken?: string
  sessionId?: string

  // Timeline
  date?: string
  lastModified?: string

  // Totals
  netValue?: number
  taxValue?: number
  transportValue?: number
  totalValue?: number
  totalItems?: number
  totalRefundedAmount?: number

  // Derived (used by frontend)
  subtotal?: number
  discountAmount?: number
  shippingFee?: number
  taxAmount?: number
  total?: number

  // Discount
  discountCode?: string
  discountValue?: number

  // Status & payment
  status?: string
  paymentStatus?: string
  paymentType?: string
  paymentMethod?: string

  // Customer
  customerId?: number
  customer?: PersonPojo
  customerName?: string
  customerEmail?: string

  // Salesperson / Shipper
  salesperson?: PersonPojo
  shipper?: string

  // Billing
  billingCompany?: BillingCompanyPojo | string
  billingType?: string
  billingIdNumber?: string
  billingAddress?: AddressPojo | string

  // Shipping
  shippingAddress?: AddressPojo | string
  shippingCity?: string
  shippingDistrict?: string
  shippingWard?: string
  shippingMethod?: string
  trackingNumber?: string
  recipientName?: string
  recipientPhone?: string
  recipientEmail?: string

  // Other
  notes?: string
  active?: boolean
  details?: OrderDetailPojo[]
}

export type OrderSearchParams = {
  status?: string
  paymentStatus?: string
  customerName?: string
  trackingNumber?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
}

export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────

export const searchOrders = (params: OrderSearchParams) => {
  return orderService.get<PageResponse<OrderPojo[]>>('', { params })
}

export const getOrderById = (id: number) => {
  return orderService.get<OrderPojo>(`/${id}`)
}

export const createOrder = (data: OrderPojo) => {
  return orderService.post<OrderPojo>('', data)
}

export const updateOrder = (id: number, data: OrderPojo) => {
  return orderService.put<OrderPojo>(`/${id}`, data)
}

export const deleteOrder = (id: number) => {
  return orderService.delete<void>(`/${id}`)
}

export const confirmOrder = (id: number) => {
  return orderService.post<OrderPojo>('/confirmation', { id })
}

export const rejectOrder = (id: number, reason?: string) => {
  return orderService.post<OrderPojo>('/rejection', { id, notes: reason })
}

export const completeOrder = (id: number) => {
  return orderService.post<OrderPojo>('/completion', { id })
}

export const cancelOrder = (id: number, reason?: string) => {
  return orderService.post<OrderPojo>('/cancellation', { id, notes: reason })
}
