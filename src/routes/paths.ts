export const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
}

export const paths = {
  // Auth pages
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',

  // Dashboard
  dashboard: {
    root: `${ROOTS.DASHBOARD}`,
  },

  // Products Management
  products: {
    root: '/products',
    list: '/products/list',
    new: '/products/new',
    edit: (id: string) => `/products/${id}`,
    variants: (id: string) => `/products/${id}/variants`,
  },

  // Categories
  categories: {
    root: '/categories',
    list: '/categories/list',
  },

  // Orders
  orders: {
    root: '/orders',
    list: '/orders/list',
    detail: (id: string) => `/orders/${id}`,
    new: '/orders/new',
    editStatus: (id: string) => `/orders/${id}/edit-status`,
  },

  // Returns
  returns: {
    root: '/returns',
    list: '/returns/list',
    detail: (id: string) => `/returns/${id}`,
  },

  // Customers
  customers: {
    root: '/customers',
    list: '/customers/list',
    detail: (id: string) => `/customers/${id}`,
  },

  // Discount Codes
  discounts: {
    root: '/discounts',
    list: '/discounts/list',
    new: '/discounts/new',
    edit: (id: string) => `/discounts/${id}`,
    rules: '/discounts/rules',
  },

  // Shipping
  shipping: {
    root: '/shipping',
    list: '/shipping/methods',
  },

  // Media
  media: {
    root: '/media',
    list: '/media/list',
  },

  // Settings
  settings: {
    root: '/settings',
  },

  // Inventory
  inventory: {
    stockAdjustments: '/inventory/stock-adjustments',
    suppliers: '/inventory/suppliers',
    purchaseOrders: '/inventory/purchase-orders',
    transfers: '/inventory/transfers',
    stockCounts: '/inventory/stock-counts',
  },

  // Finance
  finance: {
    root: '/finance',
    failedPayments: '/finance/failed-payments',
    refunds: '/finance/refunds',
    reconciliation: '/finance/reconciliation',
    settlements: '/finance/settlements',
  },
}