import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const shippingService = createApiService(appApiIns, '/api/data/shipping-methods')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ShippingMethodPojo = {
  id?: number
  name: string
  baseFee: number
  freeShippingThreshold?: number
  estimatedDaysMin: number
  estimatedDaysMax: number
  active: boolean
  pricePerKm?: number
  carrierCode?: 'LOCAL' | 'GHN' | string
  rateMode?: 'STATIC' | 'DISTANCE' | 'LIVE_API' | string
  carrierServiceCode?: string
  carrierShopId?: number
}

export type ShippingSearchParams = {
  name?: string
  active?: boolean
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

export const searchShippingMethods = (params?: ShippingSearchParams) => {
  return shippingService.get<PageResponse<ShippingMethodPojo[]>>('', { params })
}

export const getShippingMethodById = (id: number) => {
  return shippingService.get<ShippingMethodPojo>(`/${id}`)
}

export const createShippingMethod = (data: ShippingMethodPojo) => {
  return shippingService.post<ShippingMethodPojo>('', data)
}

export const updateShippingMethod = (id: number, data: ShippingMethodPojo) => {
  return shippingService.put<ShippingMethodPojo>(`/${id}`, data)
}

export const deleteShippingMethod = (id: number) => {
  return shippingService.delete<void>(`/${id}`)
}
