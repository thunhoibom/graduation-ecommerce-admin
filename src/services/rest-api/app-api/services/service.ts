import { servicesService } from './_service-instance'

// Types
export type ServiceMapping = {
  labelField?: string
  valueField?: string
}

export type Service = {
  id: number
  code: string
  name: string
  description?: string
  type: number
  script: string
  sqlScriptId?: number
  status: number
  mapping?: ServiceMapping
  /** CREATED_DATETIME (design Stan89) */
  createdDateTime?: string
}

export type ServiceRequest = {
  code: string
  name: string
  description?: string
  type: number
  sqlScriptId?: number
  status: number
}

export type ServiceSearchParams = {
  code?: string
  name?: string
  type?: number
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
export const getServices = async (
  params?: ServiceSearchParams,
): Promise<PageResponse<Service[]>> => {
  return servicesService.get<PageResponse<Service[]>>('', { params })
}

export const getServiceById = async (id: number): Promise<BaseResponse<Service>> => {
  return servicesService.get<BaseResponse<Service>>(`/${id}`)
}

export const createService = async (
  data: ServiceRequest,
): Promise<BaseResponse<Service>> => {
  return servicesService.post<BaseResponse<Service>>('', data)
}

export const updateService = async (
  id: number,
  data: ServiceRequest,
): Promise<BaseResponse<Service>> => {
  return servicesService.put<BaseResponse<Service>>(`/${id}`, data)
}

export const deleteService = async (id: number): Promise<BaseResponse<void>> => {
  return servicesService.delete<BaseResponse<void>>(`/${id}`)
}

export const syncServiceScript = async (id: number): Promise<BaseResponse<Service>> => {
  return servicesService.post<BaseResponse<Service>>(`/${id}/sync-script`, {})
}
