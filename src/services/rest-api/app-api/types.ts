import type { ErrorResponse } from '@/shared/utils/error'

export type BaseJSONResponse<Data = unknown> = {
  success: boolean
  data: Data
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type TFetchedResponse<T> = BaseJSONResponse<T> | Array<T>

export type Link = {
  url?: string
  label: string
  active: boolean
}

export type PaginationParams<Data extends Record<string, any>> = Data & {
  page?: number
  limit?: number
  paginated?: boolean
  sort?: string
}

export type ExtendingParams<Data extends Record<string, any>> = Data & {
  with?: string[]
  sort?: string
}

export type TServerError = ErrorResponse

export type TErrorName = 'COMMON_ERROR'

export type TCommonRequestId = string | number
