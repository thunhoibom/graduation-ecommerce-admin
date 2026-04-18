import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const mediaService = createApiService(appApiIns, '/api/data/images')

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ImagePojo = {
  id?: number
  code: string
  filename: string
  url: string
  createdAt?: string
  updatedAt?: string
}

export type ImageSearchParams = {
  code?: string
  filename?: string
  page?: number
  size?: number
  sortBy?: string
  order?: 'asc' | 'desc'
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

export const searchImages = (params?: ImageSearchParams) => {
  return mediaService.get<PageResponse<ImagePojo[]>>('', { params })
}

export const getImageById = (id: number) => {
  return mediaService.get<ImagePojo>(`/${id}`)
}

export const createImage = (data: ImagePojo) => {
  return mediaService.post<ImagePojo>('', data)
}

export const updateImage = (id: number, data: ImagePojo) => {
  return mediaService.put<ImagePojo>(`/${id}`, data)
}

export const deleteImage = (id: number) => {
  return mediaService.delete<void>(`/${id}`)
}
