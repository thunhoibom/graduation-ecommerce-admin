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
  url?: string
  altText?: string
}

export type ProductPojo = {
  id?: number
  name: string
  barcode: string
  description?: string
  price: number
  currentStock?: number
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
  criticalStock?: number
  reservedStock?: number
  availableStock?: number
  active?: boolean
  barcode?: string
  productBarcode: string
  productName?: string
  productBasePrice?: number
  finalPrice?: number
  createdAt?: string
}

export type ProductSearchParams = {
  name?: string
  barcode?: string
  categoryCode?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  active?: boolean
}

export type VariantSearchParams = {
  productBarcode?: string
  sku?: string
  size?: string
  color?: string
  active?: boolean
  page?: number
  size?: number
}

// ─────────────────────────────────────────────────────────────────
// Product APIs
// ─────────────────────────────────────────────────────────────────

export type PageResponse<T> = {
  success: boolean
  message?: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

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

export const searchCategories = (params?: { page?: number; size?: number }) => {
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
