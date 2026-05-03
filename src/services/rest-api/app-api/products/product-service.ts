import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const productService = createApiService(appApiIns, '/api/data/products')
const categoryService = createApiService(appApiIns, '/api/data/product_categories')
const variantService = createApiService(appApiIns, '/api/data/product-variants')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ProductCategoryPojo = {
  code: string
  name: string
  parent?: ProductCategoryPojo
}

export type ImagePojo = {
  id?: number
  code?: string
  filename?: string
  url?: string
  altText?: string
}


export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'UNLISTED'

export type ProductPojo = {
  id?: number
  name: string
  barcode: string
  description?: string
  price: number
  status: ProductStatus
  currentStock?: number
  reservedStock?: number
  availableStock?: number
  onHand?: number
  reserved?: number
  availableToSell?: number
  criticalStock?: number
  category?: ProductCategoryPojo
  images?: ImagePojo[]
  averageRating?: number
  totalReviews?: number
}

export type ProductVariantPojo = {
  id?: number
  sku: string
  size: string
  color?: string
  attributes?: string
  priceModifier?: number
  currentStock?: number
  reservedStock?: number
  availableStock?: number
  onHand?: number
  reserved?: number
  availableToSell?: number
  criticalStock?: number
  active?: boolean
  barcode?: string
  productBarcode: string
  productName?: string
  productBasePrice?: number
  finalPrice?: number
  images?: ImagePojo[]
  primaryImageUrl?: string
  createdAt?: string
}


export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

export type ProductAuditEntityType = 'PRODUCT' | 'VARIANT'

export type ProductAuditLogPojo = {
  id: number
  occurredAt: string
  actorUsername?: string
  actorUserId?: number
  action: string
  entityType: ProductAuditEntityType
  entityId: number
  productId?: number
  variantId?: number
  entityCode?: string
  summary?: string
  beforeSnapshot?: string
  afterSnapshot?: string
  requestSource?: string
  correlationId?: string
}

export type ProductSearchParams = {
  name?: string
  barcode?: string
  categoryCode?: string
  minPrice?: number
  maxPrice?: number
  pageIndex?: number
  pageSize?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  status?: ProductStatus
}

export type VariantSearchParams = {
  productBarcode?: string
  sku?: string
  size?: string
  color?: string
  active?: boolean
  pageIndex?: number
  pageSize?: number
}

export type ProductAuditSearchParams = {
  entityType?: ProductAuditEntityType
  entityId?: number
  productId?: number
  variantId?: number
  action?: string
  actor?: string
  from?: string
  to?: string
  pageIndex?: number
  pageSize?: number
}


// ─────────────────────────────────────────────────────────────────
// Product APIs
// ─────────────────────────────────────────────────────────────────

export const searchProducts = (params: ProductSearchParams) => {
  return productService.get<PageResponse<ProductPojo[]>>('', { params })
}

export const getProductById = (id: number) => {
  return productService.get<ProductPojo>(`/${id}`)
}

export const createProduct = (data: ProductPojo) => {
  return productService.post<ProductPojo>('', data)
}

export const updateProduct = (id: number, data: ProductPojo) => {
  return productService.put<ProductPojo>(`/${id}`, data)
}

export const deleteProduct = (id: number) => {
  return productService.delete<void>(`/${id}`)
}

export const patchProduct = (id: number, data: Record<string, unknown>) => {
  return productService.patch<void>(`/${id}`, data)
}

// ─────────────────────────────────────────────────────────────────
// Category APIs
// ─────────────────────────────────────────────────────────────────

export const searchCategories = (params?: { pageIndex?: number; pageSize?: number }) => {
  return categoryService.get<PageResponse<ProductCategoryPojo[]>>('', { params })
}

export const getCategoryById = (id: number) => {
  return categoryService.get<ProductCategoryPojo>(`/${id}`)
}

export const createCategory = (data: ProductCategoryPojo) => {
  return categoryService.post<ProductCategoryPojo>('', data)
}

export const updateCategory = (id: number, data: ProductCategoryPojo) => {
  return categoryService.put<ProductCategoryPojo>(`/${id}`, data)
}

export const deleteCategory = (id: number) => {
  return categoryService.delete<void>(`/${id}`)
}

// ─────────────────────────────────────────────────────────────────
// Variant APIs
// ─────────────────────────────────────────────────────────────────

export const searchVariants = (params: VariantSearchParams) => {
  return variantService.get<PageResponse<ProductVariantPojo[]>>('', { params })
}

export const getVariantById = (id: number) => {
  return variantService.get<ProductVariantPojo>(`/${id}`)
}

export const createVariant = (data: ProductVariantPojo) => {
  return variantService.post<ProductVariantPojo>('', data)
}

export const updateVariant = (id: number, data: ProductVariantPojo) => {
  return variantService.put<ProductVariantPojo>(`/${id}`, data)
}

export const deleteVariant = (id: number) => {
  return variantService.delete<void>(`/${id}`)
}

// ─────────────────────────────────────────────────────────────────
// Bulk / CSV Operations — Products
// ─────────────────────────────────────────────────────────────────

export const EXPORT_PRODUCTS_URL = '/api/data/products/export'
export const IMPORT_PRODUCTS_URL = '/api/data/products/import'
export const BULK_PUBLISH_URL = '/api/data/products/bulk-publish'
export const BULK_UNPUBLISH_URL = '/api/data/products/bulk-unpublish'
export const BULK_DELETE_URL = '/api/data/products/bulk-delete'

// ─────────────────────────────────────────────────────────────────
// Bulk / CSV Operations — Variants
// ─────────────────────────────────────────────────────────────────

export const EXPORT_VARIANTS_URL = '/api/data/product-variants/export'
export const IMPORT_VARIANTS_URL = '/api/data/product-variants/import'
export const BULK_ACTIVATE_VARIANTS_URL = '/api/data/product-variants/bulk-activate'
export const BULK_DEACTIVATE_VARIANTS_URL = '/api/data/product-variants/bulk-deactivate'
export const BULK_DELETE_VARIANTS_URL = '/api/data/product-variants/bulk-delete'
export const BULK_UPDATE_VARIANTS_URL = '/api/data/product-variants/bulk-update'

export type BulkOperationResult = {
  successCount: number
  errorCount: number
  errors: string[] | null
}

export type VariantBulkUpdateRequest = {
  ids: number[]
  priceModifier?: number
  active?: boolean
}

export type ProductCsvImportResult = {
  totalRows: number
  successCount: number
  errorCount: number
  errors: { row: number; rowData: string; error: string }[] | null
}

export const bulkPublish = (ids: number[]) => {
  return productService.post<BulkOperationResult>('/bulk-publish', ids)
}

export const bulkUnpublish = (ids: number[]) => {
  return productService.post<BulkOperationResult>('/bulk-unpublish', ids)
}

export const bulkDelete = (ids: number[]) => {
  return productService.post<BulkOperationResult>('/bulk-delete', ids)
}

/**
 * Import a CSV file as multipart/form-data.
 * Uses the raw axios instance directly (BaseApi only supports JSON).
 */
export const importProducts = (file: File): Promise<ProductCsvImportResult> => {
  const formData = new FormData()
  formData.append('file', file)

  return appApiIns.post<ProductCsvImportResult>(IMPORT_PRODUCTS_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Download products CSV via browser redirect (returns blob directly). */
export const downloadProductsCSV = (
  categoryCode?: string,
  filename = 'products.csv'
): void => {
  const url = new URL(
    categoryCode ? `${EXPORT_PRODUCTS_URL}?categoryCode=${encodeURIComponent(categoryCode)}` : EXPORT_PRODUCTS_URL,
    appApiIns.defaults.baseURL ?? 'http://localhost:8080'
  )

  const accessToken = localStorage.getItem('accessToken')
  const link = document.createElement('a')
  link.href = url.toString()
  if (accessToken) {
    link.setAttribute('Authorization', `Bearer ${accessToken}`)
  }
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ─────────────────────────────────────────────────────────────────
// Variants bulk operations
// ─────────────────────────────────────────────────────────────────

export const downloadVariantsCSV = (
  productBarcode?: string,
  filename = 'variants.csv'
): void => {
  const url = new URL(
    productBarcode ? `${EXPORT_VARIANTS_URL}?productBarcode=${encodeURIComponent(productBarcode)}` : EXPORT_VARIANTS_URL,
    appApiIns.defaults.baseURL ?? 'http://localhost:8080'
  )

  const accessToken = localStorage.getItem('accessToken')
  const link = document.createElement('a')
  link.href = url.toString()
  if (accessToken) {
    link.setAttribute('Authorization', `Bearer ${accessToken}`)
  }
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const importVariants = (file: File): Promise<ProductCsvImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return appApiIns.post<ProductCsvImportResult>(IMPORT_VARIANTS_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const bulkActivateVariants = (ids: number[]) =>
  variantService.post<BulkOperationResult>('/bulk-activate', ids)

export const bulkDeactivateVariants = (ids: number[]) =>
  variantService.post<BulkOperationResult>('/bulk-deactivate', ids)

export const bulkDeleteVariants = (ids: number[]) =>
  variantService.post<BulkOperationResult>('/bulk-delete', ids)

export const bulkUpdateVariants = (payload: VariantBulkUpdateRequest) =>
  variantService.post<BulkOperationResult>('/bulk-update', payload)

// ─────────────────────────────────────────────────────────────────
// Product audit logs
// ─────────────────────────────────────────────────────────────────

export const searchProductAuditLogs = (params: ProductAuditSearchParams) => {
  return appApiIns.get<PageResponse<ProductAuditLogPojo[]>>('/api/data/product-audit-logs', { params })
}

export const getProductAuditLogsByProductId = (
  productId: number,
  params?: { pageIndex?: number; pageSize?: number }
) => {
  return appApiIns.get<PageResponse<ProductAuditLogPojo[]>>(
    `/api/data/product-audit-logs/products/${productId}`,
    { params }
  )
}

export const getProductAuditLogsByVariantId = (
  variantId: number,
  params?: { pageIndex?: number; pageSize?: number }
) => {
  return appApiIns.get<PageResponse<ProductAuditLogPojo[]>>(
    `/api/data/product-audit-logs/variants/${variantId}`,
    { params }
  )
}
