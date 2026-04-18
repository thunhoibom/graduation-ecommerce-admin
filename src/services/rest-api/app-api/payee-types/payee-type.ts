import { payeeTypesService } from './_service-instance'

// Types
export type PayeeType = {
  id: number
  code: string
  name: string
  description?: string
  status: number
  createdDateTime?: string
}

export type PayeeTypeRequest = {
  code: string
  name: string
  description?: string
  status?: number
}

export type PayeeTypeSearchParams = {
  code?: string
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

export type PayeeTypeDropdownItem = {
  id: number
  code: string
  name: string
}

// API functions
export const getPayeeTypes = async (
  params?: PayeeTypeSearchParams,
): Promise<PageResponse<PayeeType[]>> => {
  return payeeTypesService.get<PageResponse<PayeeType[]>>('', { params })
}

export const getPayeeTypeById = async (id: number): Promise<BaseResponse<PayeeType>> => {
  return payeeTypesService.get<BaseResponse<PayeeType>>(`/${id}`)
}

export const createPayeeType = async (
  data: PayeeTypeRequest,
): Promise<BaseResponse<PayeeType>> => {
  return payeeTypesService.post<BaseResponse<PayeeType>>('', data)
}

export const copyPayeeType = async (
  sourceId: number,
  data: PayeeTypeRequest,
): Promise<BaseResponse<PayeeType>> => {
  return payeeTypesService.post<BaseResponse<PayeeType>>(`/${sourceId}/copy`, data)
}

export const updatePayeeType = async (
  id: number,
  data: PayeeTypeRequest,
): Promise<BaseResponse<PayeeType>> => {
  return payeeTypesService.put<BaseResponse<PayeeType>>(`/${id}`, data)
}

export const deletePayeeType = async (id: number): Promise<BaseResponse<void>> => {
  return payeeTypesService.delete<BaseResponse<void>>(`/${id}`)
}

export const getPayeeTypeDropdown = async (): Promise<PayeeTypeDropdownItem[]> => {
  const res = await payeeTypesService.get<BaseResponse<PayeeTypeDropdownItem[]>>('/dropdown')
  return res.data
}
