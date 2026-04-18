import { tableOutputsService } from './_service-instance'

// Types
export type TableOutputField = {
  id?: number
  fieldCode: string
  fieldName: string
  status: number
  description?: string
  fieldDataType?: string
  isMapping?: number
  createdDateTime?: string
}

export type TableOutput = {
  id: number
  name: string
  description?: string
  status: number
  createdDateTime?: string
  fields: TableOutputField[]
}

export type TableOutputFieldRequest = {
  id?: number
  fieldCode: string
  fieldName: string
  status: number
  description?: string
  fieldDataType?: string
  isMapping?: number
}

export type TableOutputRequest = {
  name: string
  description?: string
  status: number
  fields: TableOutputFieldRequest[]
}

export type TableOutputSearchParams = {
  name?: string
  description?: string
  status?: number
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

export type BaseResponse<T> = {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

// API Functions
export const getTableOutputs = async (
  params?: TableOutputSearchParams,
): Promise<PageResponse<TableOutput[]>> => {
  return tableOutputsService.get<PageResponse<TableOutput[]>>('', { params })
}

export const getTableOutputById = async (id: number): Promise<BaseResponse<TableOutput>> => {
  return tableOutputsService.get<BaseResponse<TableOutput>>(`/${id}`)
}

export const createTableOutput = async (
  data: TableOutputRequest,
): Promise<BaseResponse<TableOutput>> => {
  return tableOutputsService.post<BaseResponse<TableOutput>>('', data)
}

export const updateTableOutput = async (
  id: number,
  data: TableOutputRequest,
): Promise<BaseResponse<TableOutput>> => {
  return tableOutputsService.put<BaseResponse<TableOutput>>(`/${id}`, data)
}

export const deleteTableOutput = async (id: number): Promise<BaseResponse<void>> => {
  return tableOutputsService.delete<BaseResponse<void>>(`/${id}`)
}

/** Metadata cột bảng từ DB (Tải tham số) */
export type TableOutputFieldMetadata = {
  fieldCode: string
  fieldName: string
  fieldDataType?: string
}

export const loadTableParams = async (
  tableName: string,
): Promise<BaseResponse<TableOutputFieldMetadata[]>> => {
  return tableOutputsService.get<BaseResponse<TableOutputFieldMetadata[]>>('/load-params', {
    params: { tableName },
  })
}
