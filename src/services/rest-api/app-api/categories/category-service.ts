import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const categoryService = createApiService(appApiIns, '/api/data/product_categories')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ImagePojo = {
  id?: number
  code?: string
  filename?: string
  url?: string
  altText?: string
}

export type CategoryPojo = {
  id?: number
  code: string
  name: string
  image?: ImagePojo
  parent?: CategoryPojo
  children?: CategoryPojo[]
}

export type CategorySearchParams = {
  pageIndex?: number
  pageSize?: number
}

export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────

export const searchCategories = (params?: CategorySearchParams) => {
  return categoryService.get<PageResponse<CategoryPojo[]>>('', { params })
}

export const getCategoryById = (id: number) => {
  return categoryService.get<CategoryPojo>(`/${id}`)
}

export const getCategoryByCode = (code: string) => {
  return categoryService.get<CategoryPojo>(`/${code}`)
}

export const createCategory = (data: CategoryPojo) => {
  return categoryService.post<CategoryPojo>('', data)
}

export const updateCategory = (id: number, data: CategoryPojo) => {
  return categoryService.put<CategoryPojo>(`/${id}`, data)
}

export const deleteCategory = (id: number) => {
  return categoryService.delete<void>(`/${id}`)
}
