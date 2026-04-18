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
    detail: (id: string) => `/products/${id}/detail`,
    edit: (id: string) => `/products/${id}/edit`,
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
    detail: (id: string) => `/orders/${id}/detail`,
  },

  // Returns
  returns: {
    root: '/returns',
    list: '/returns/list',
    detail: (id: string) => `/returns/${id}/detail`,
  },

  // Customers
  customers: {
    root: '/customers',
    list: '/customers/list',
    detail: (id: string) => `/customers/${id}/detail`,
  },

  // Discount Codes
  discounts: {
    root: '/discounts',
    list: '/discounts/list',
    new: '/discounts/new',
    edit: (id: string) => `/discounts/${id}/edit`,
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
}