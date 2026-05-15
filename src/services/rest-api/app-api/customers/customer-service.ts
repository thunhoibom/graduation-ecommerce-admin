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
  /** Customer row id (same as `customerId` when present) */
  id?: number
  customerId?: number
  firstName?: string
  lastName?: string
  email?: string
  phone1?: string
  phone2?: string
  idNumber?: string
  /** Populated on list/search from backend */
  orderCount?: number
  loyaltyTier?: string | null
  loyaltyPointsBalance?: number | null
  /** Same unit as backend `monthlySpendCents` (integer VND đồng in practice). */
  monthlySpendCents?: number | null
  linkedAccount?: boolean | null
  // Enriched fields from joined entities
  addresses?: AddressPojo[]
  orders?: CustomerOrderPojo[]
  totalSpent?: number
  createdAt?: string
  lastModified?: string
}

export type CustomerSearchParams = {
  /** Single search box: backend matches name / email / phone (see `q`) */
  q?: string
  pageIndex?: number
  pageSize?: number
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

export const searchCustomers = (params: CustomerSearchParams) => {
  return customerService.get<PageResponse<CustomerPojo[]>>('', { params })
}

export const getCustomerDetail = (id: number) => {
  return customerService.get<CustomerPojo>(`/${id}/detail`)
}

export const getCustomerById = (id: number) => {
  return getCustomerDetail(id)
}

export const patchCustomer = (id: number, body: Record<string, unknown>) => {
  return customerService.patch<void>(`/${id}`, body)
}

export const createCustomer = (data: Record<string, unknown>) => {
  return customerService.post<void>('', data)
}

export const deleteCustomer = (id: number) => {
  return customerService.delete<void>(`/${id}`)
}

/** @deprecated Prefer patchCustomer for partial updates */
export const updateCustomer = (id: number, data: Partial<CustomerPojo>) => {
  return customerService.put<CustomerPojo>(`/${id}`, data)
}
