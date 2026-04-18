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

export interface AdminDashboardStatsPojo {
  totalRevenue: number
  totalOrders: number
  orderStatusBreakdown: OrderStatusCountPojo[]
  revenueByPeriod: RevenueStatPojo[]
  topProducts: TopProductPojo[]
  lowStockAlerts: LowStockAlertPojo[]
}