import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const discountService = createApiService(appApiIns, '/api/data/discount-codes')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type DiscountCodePojo = {
  id?: number
  code: string
  description?: string
  type: string   // PERCENT, FIXED
  value: number
  maxUses?: number
  useCount?: number
  maxUsesPerCustomer?: number
  minCartValue?: number
  validFrom?: string
  validUntil?: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
  currentlyValid?: boolean
  remainingUses?: number
}

export type DiscountSearchParams = {
  code?: string
  active?: boolean
  type?: string
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

export const searchDiscounts = (params: DiscountSearchParams) => {
  return discountService.get<PageResponse<DiscountCodePojo[]>>('', { params })
}

export const getDiscountById = (id: number) => {
  return discountService.get<DiscountCodePojo>(`/${id}`)
}

export const createDiscount = (data: DiscountCodePojo) => {
  return discountService.post<DiscountCodePojo>('', data)
}

export const updateDiscount = (id: number, data: DiscountCodePojo) => {
  return discountService.put<DiscountCodePojo>(`/${id}`, data)
}

export const deleteDiscount = (id: number) => {
  return discountService.delete<void>(`/${id}`)
}

export const toggleDiscountActive = (id: number, active: boolean) => {
  return discountService.patch<void>(`/${id}`, { active })
}