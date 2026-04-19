import { appApiIns } from '../../../../../services/rest-api/app-api/api-instance'
import { AdminDashboardStatsPojo } from '../types'

const BASE = '/api/admin/dashboard'

export const dashboardService = {
  getStats(params?: { from?: string; to?: string }): Promise<AdminDashboardStatsPojo> {
    return appApiIns.get(`${BASE}/stats`, { params })
  },

  getTopProducts(params?: { from?: string; to?: string; limit?: number }): Promise<{ topProducts: any[] }> {
    return appApiIns.get(`${BASE}/stats/top-products`, { params })
  },

  getRevenue(params?: { from?: string; to?: string }): Promise<{ revenueByPeriod: any[] }> {
    return appApiIns.get(`${BASE}/stats/revenue`, { params })
  },

  getOrderStatuses(): Promise<{ orderStatusBreakdown: any[] }> {
    return appApiIns.get(`${BASE}/stats/order-statuses`)
  },

  getLowStock(): Promise<{ lowStockAlerts: any[] }> {
    return appApiIns.get(`${BASE}/stats/low-stock`)
  },
}