import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const customerService = createApiService(appApiIns, '/api/data/customers')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type CustomerPojo = {
  id?: number
  firstName?: string
  lastName?: string
  email: string
  phone1?: string
  phone2?: string
  idNumber?: string
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
