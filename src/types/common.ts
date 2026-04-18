export interface BaseJsonResponse<T> {
  data: T
  status: number
  message: string
  success: boolean
}

export type BaseResponse<T> = {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export type PageResponse<T> = {
  success: boolean
  message: string
  data: T[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  timestamp: string
}

export type SearchRequest = {
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  sorts?: string
}