import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const customerService = createApiService(appApiIns, '/api/data/customers')

// ─────────────────────────────────────────────────────────────────
// Types
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
  isDefault?: boolean
  label?: string   // 'Nhà riêng', 'Văn phòng', ...
}

export type CustomerOrderPojo = {
  id?: number
  date?: string
  totalValue?: number
  status?: string
  paymentStatus?: string
  itemCount?: number
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  discountCode?: string
  discountValue?: number
}

export type CustomerPojo = {
  id?: number
  firstName?: string
  lastName?: string
  email: string
  phone1?: string
  phone2?: string
  idNumber?: string
  // Enriched fields from joined entities
  addresses?: AddressPojo[]
  orders?: CustomerOrderPojo[]
  orderCount?: number
  totalSpent?: number
  createdAt?: string
  lastModified?: string
}

export type CustomerSearchParams = {
  name?: string
  email?: string
  phone?: string
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

export const searchCustomers = (params: CustomerSearchParams) => {
  return customerService.get<PageResponse<CustomerPojo[]>>('', { params })
}

export const getCustomerById = (id: number) => {
  return customerService.get<CustomerPojo>(`/${id}`)
}

export const updateCustomer = (id: number, data: Partial<CustomerPojo>) => {
  return customerService.put<CustomerPojo>(`/${id}`, data)
}

export const getCustomerAddresses = (customerId: number) => {
  return customerService.get<AddressPojo[]>(`/${customerId}/addresses`)
}

export const getCustomerOrders = (customerId: number, params?: { page?: number; size?: number }) => {
  return customerService.get<PageResponse<CustomerOrderPojo[]>>(`/${customerId}/orders`, { params })
}
