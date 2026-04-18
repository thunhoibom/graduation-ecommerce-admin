import { menuService } from './_service-instance'

/** Menu API types - GET /api/v1/auth/menu */

export type MenuPrivilege = 'ACCESS' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT'

export type MenuItemResponse = {
  id: number
  code: string
  name: string
  icon: string | null
  parentId: number | null
  privileges: MenuPrivilege[]
  ord: number
  children: MenuItemResponse[]
}

/** API response – trả trực tiếp { menus: [...] }, KHÔNG có BaseResponse wrapper */
export type MenuResponse = {
  menus: MenuItemResponse[]
}

/** Internal frontend type - maps menu code → route path */
export type MenuCodeRouteMap = Record<string, string>

/**
 * Default route mapping: menu code → route path
 */
export const MENU_CODE_ROUTE_MAP: MenuCodeRouteMap = {
  // Quản lý cấu hình (COMM.CONFIG)
  'COMM.CONFIG.SERVICES': '/configuration-management/services',
  'COMM.CONFIG.TO': '/configuration-management/table-outputs',
  'COMM.CONFIG.INPUTD': '/configuration-management/input-defs',

  // Danh mục (COMM.CATE)
  'COMM.CATE.PAYEET': '/category/payee-types',

  // Quản lý đối tượng (COMM.OM)
  'COMM.OM.OBJECTL': '/object-management/object-list',

  // Quản lý kịch bản (COMM.SM)
  'COMM.SM.INCENTIVE': '/scenario-management/incentive',
  'COMM.SM.CCYCLE': '/scenario-management/comm-cycles',
  'COMM.SM.PLANS': '/scenario-management/plans',
  'COMM.SM.APPROVALS': '/scenario-management/approvals',
  'COMM.SM.TRANSTYPE': '/scenario-management/transaction-types',
  'COMM.SM.TRANS': '/scenario-management/transactions',
  'COMM.SM.CALCU': '/scenario-management/calculations',

  // Quản lý chi phí (COMM.COMM)
  'COMM.COMM.APPROVALS': '/commission-management/approvals',
  'COMM.COMM.SEARCH': '/commission-management/search',
  'COMM.COMM.PROFILES': '/commission-management/payment-request',
  'COMM.COMM.PAYOUTS': '/commission-management/payout',
  'COMM.COMM.ADJS': '/commission-management/adjustments',
}

/** Gọi API lấy danh sách menu theo quyền user */
export const getMenus = (): Promise<MenuResponse> =>
  menuService.get<MenuResponse>('')
