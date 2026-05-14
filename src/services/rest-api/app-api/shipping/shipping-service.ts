import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const shippingService = createApiService(appApiIns, '/api/data/shipping-methods')

function requireShippingMethodId(id: number | undefined): number {
  if (id == null || !Number.isFinite(Number(id))) {
    throw new Error('Missing or invalid shipping method id')
  }
  return Number(id)
}

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
  /** Exact match (backend `name`) */
  name?: string
  /** Partial match (backend `nameLike`) */
  nameLike?: string
  active?: boolean
  /** 0-based, matches backend `PaginationService` */
  pageIndex?: number
  pageSize?: number
}

/** Mirrors backend {@link DataPagePojo} */
export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────

export const searchShippingMethods = (params?: ShippingSearchParams) => {
  return shippingService.get<PageResponse<ShippingMethodPojo[]>>('', { params })
}

export const getShippingMethodById = (id: number) => {
  return shippingService.get<ShippingMethodPojo>(`/${requireShippingMethodId(id)}`)
}

export const createShippingMethod = (data: ShippingMethodPojo) => {
  return shippingService.post<ShippingMethodPojo>('', data)
}

export const updateShippingMethod = (id: number, data: ShippingMethodPojo) => {
  return shippingService.put<ShippingMethodPojo>(`/${requireShippingMethodId(id)}`, data)
}

export const deleteShippingMethod = (id: number) => {
  return shippingService.delete<void>(`/${requireShippingMethodId(id)}`)
}
