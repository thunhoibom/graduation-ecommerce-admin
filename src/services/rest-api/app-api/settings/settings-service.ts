import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const settingsService = createApiService(appApiIns, '/api/data/params')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ParamPojo = {
  id?: number
  category: string
  name: string
  value: string
}

export type ParamSearchParams = {
  category?: string
  name?: string
  page?: number
  size?: number
}

export type PageResponse<T> = {
  success: boolean
  message?: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────

export const searchParams = (params?: ParamSearchParams) => {
  return settingsService.get<PageResponse<ParamPojo[]>>('', { params })
}

export const getParamById = (id: number) => {
  return settingsService.get<ParamPojo>(`/${id}`)
}

export const updateParam = (id: number, data: ParamPojo) => {
  return settingsService.put<ParamPojo>(`/${id}`, data)
}

// Convenience: fetch params by category (e.g., "shop", "payment", "system")
export const getParamsByCategory = (category: string) => {
  return searchParams({ category, size: 100 })
}