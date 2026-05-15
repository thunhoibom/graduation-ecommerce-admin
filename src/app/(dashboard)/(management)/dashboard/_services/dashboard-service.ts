import { appApiIns } from '../../../../../services/rest-api/app-api/api-instance'
import {
  AdminDashboardStatsPojo,
  RestockSuggestionPojo,
  RevenueGroupBy,
  RevenueStatPojo,
} from '../types'

const BASE = '/api/admin/dashboard'

export const dashboardService = {
  getStats(params?: { from?: string; to?: string }): Promise<AdminDashboardStatsPojo> {
    return appApiIns.get(`${BASE}/stats`, { params })
  },

  getTopProducts(params?: { from?: string; to?: string; limit?: number }) {
    return appApiIns.get(`${BASE}/stats/top-products`, { params })
  },

  getRevenue(params?: { from?: string; to?: string; groupBy?: RevenueGroupBy }): Promise<RevenueStatPojo[]> {
    return appApiIns.get(`${BASE}/stats/revenue`, { params })
  },

  getOrderStatuses(params?: { from?: string; to?: string }) {
    return appApiIns.get(`${BASE}/stats/order-statuses`, { params })
  },

  getLowStock() {
    return appApiIns.get(`${BASE}/stats/low-stock`)
  },

  getRestockSuggestions(params?: {
    lookbackDays?: number
    leadTimeDays?: number
  }): Promise<RestockSuggestionPojo[]> {
    return appApiIns.get(`${BASE}/stats/low-stock/restock-suggestions`, { params })
  },
}