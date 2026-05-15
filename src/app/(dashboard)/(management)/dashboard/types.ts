// Dashboard page types
export interface OrderStatusCountPojo {
  status: string
  count: number
}

export interface RevenueStatPojo {
  date: string
  revenue: number
  orderCount: number
}

export interface TopProductPojo {
  productId: number
  productName: string
  unitsSold: number
  revenue: number
}

export interface LowStockAlertPojo {
  variantId: number
  productName: string
  size: string
  color: string
  currentStock: number
  criticalStock: number
}

export interface RestockSuggestionPojo {
  variantId: number
  sku?: string
  productName: string
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

export type RevenueGroupBy = 'day' | 'week' | 'month'

export interface AdminDashboardStatsPojo {
  totalRevenue: number
  totalOrders: number
  orderStatusBreakdown: OrderStatusCountPojo[]
  revenueByPeriod: RevenueStatPojo[]
  topProducts: TopProductPojo[]
  lowStockAlerts: LowStockAlertPojo[]
  inventoryKpis?: {
    openPurchaseOrders: number
    pendingTransferApprovals: number
    pendingStockCountApprovals: number
    approvedStockCountsToPost: number
  }
}