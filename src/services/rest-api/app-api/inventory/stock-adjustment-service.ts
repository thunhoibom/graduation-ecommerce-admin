import { appApiIns } from '../api-instance'

const STOCK_BASE = '/api/data/stock-adjustments'
const DASHBOARD_BASE = '/api/admin/dashboard'

export type AdjustmentType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT'

export type StockAdjustmentRequest = {
  variantId: number
  type: AdjustmentType
  quantity?: number
  targetStock?: number
  reason: string
  description?: string
  orderId?: number
  performedBy?: number
}

export type StockAdjustmentPojo = {
  id: number
  date: string
  variantId: number
  variantSku?: string
  variantSize?: string
  variantColor?: string
  productName?: string
  reason: string
  quantityDelta: number
  stockBefore: number
  stockAfter: number
  description?: string
  sessionId?: string
  orderId?: number
  returnRequestId?: number
  performedBy?: number
}

export type RestockSuggestionPojo = {
  variantId: number
  sku: string
  productName?: string
  size?: string
  color?: string
  currentStock: number
  criticalStock: number
  lookbackDays: number
  leadTimeDays: number
  soldInLookback: number
  avgDailySold: number
  projectedDemand: number
  safetyStock: number
  recommendedRestockQty: number
}

export const recordStockAdjustment = (payload: StockAdjustmentRequest) =>
  appApiIns.post<StockAdjustmentPojo>(STOCK_BASE, payload)

export const getStockTimelineBySku = (sku: string, params?: { page?: number; size?: number }) =>
  appApiIns.get<StockAdjustmentPojo[]>(`${STOCK_BASE}/timeline/sku/${encodeURIComponent(sku)}`, { params })

export const getRestockSuggestions = (params?: { lookbackDays?: number; leadTimeDays?: number }) =>
  appApiIns.get<RestockSuggestionPojo[]>(`${DASHBOARD_BASE}/stats/low-stock/restock-suggestions`, { params })
