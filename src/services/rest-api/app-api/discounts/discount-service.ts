import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const discountService = createApiService(appApiIns, '/api/data/discount-codes')

function requireDiscountCodeId(id: number | undefined): number {
  if (id == null || !Number.isFinite(Number(id))) {
    throw new Error('Missing or invalid discount code id')
  }
  return Number(id)
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type DiscountType = 'PERCENT' | 'FIXED'

export type DiscountCodePojo = {
  id?: number
  code: string
  description?: string
  type: DiscountType
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
  // Enriched
  totalDiscountGiven?: number
  ordersUsed?: number
}

export type DiscountFormData = {
  id?: number
  code: string
  description?: string
  type: DiscountType
  value: number
  maxUses?: number
  maxUsesPerCustomer?: number
  minCartValue?: number
  validFrom?: string
  validUntil?: string
  active?: boolean
}

export type DiscountSearchParams = {
  code?: string
  active?: boolean
  type?: DiscountType
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

export const searchDiscounts = (params: DiscountSearchParams) => {
  return discountService.get<PageResponse<DiscountCodePojo[]>>('', { params })
}

export const getDiscountById = (id: number) => {
  return discountService.get<DiscountCodePojo>(`/${requireDiscountCodeId(id)}`)
}

export const createDiscount = (data: DiscountFormData) => {
  return discountService.post<DiscountCodePojo>('', data)
}

export const updateDiscount = (id: number, data: DiscountFormData) => {
  return discountService.put<DiscountCodePojo>(`/${requireDiscountCodeId(id)}`, data)
}

export const deleteDiscount = (id: number) => {
  return discountService.delete<void>(`/${requireDiscountCodeId(id)}`)
}

export const toggleDiscountActive = (id: number, active: boolean) => {
  return discountService.patch<void>(`/${requireDiscountCodeId(id)}`, { active })
}