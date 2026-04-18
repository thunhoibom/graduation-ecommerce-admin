import type { BaseResponse, PageResponse } from '@/types/common'
import { transTypeDefinitionsService } from './_service-instance'

// Types (merge from both legacy files)
export type TransTypeDefinition = {
  id?: number
  transTypeCode: string
  transTypeName?: string
  status?: number
  createdDateTime?: string
}

export type TransTypeDropdownResponse = {
  code: string
  name: string
}

export type TransTypeDefinitionSearchParams = {
  code?: string
  name?: string
  status?: number
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  sorts?: string
}

export type TransTypeDefinitionCreateRequest = {
  code: string
  name: string
}

export type TransTypeDefinitionUpdateRequest = {
  name: string
}

// API: simple list (used by input-defs)
export const getTransTypeDefinitions = async (
  status?: number,
): Promise<BaseResponse<TransTypeDefinition[]>> => {
  return transTypeDefinitionsService.get<BaseResponse<TransTypeDefinition[]>>('', {
    params: status != null ? { status } : undefined,
  })
}

// API: search, list, create, update, delete (used by scenario-management)
export const searchTransTypeDefinitions = (params: TransTypeDefinitionSearchParams) => {
  return transTypeDefinitionsService.get<PageResponse<TransTypeDefinition>>('/search', {
    params,
  })
}

export const listTransTypeDefinitions = (params?: { status?: number }) => {
  return transTypeDefinitionsService.get<BaseResponse<TransTypeDefinition[]>>('', { params })
}

export const createTransTypeDefinition = (body: TransTypeDefinitionCreateRequest) => {
  return transTypeDefinitionsService.post<BaseResponse<TransTypeDefinition>>('', body)
}

export const updateTransTypeDefinition = (
  code: string,
  body: TransTypeDefinitionUpdateRequest,
) => {
  return transTypeDefinitionsService.put<BaseResponse<TransTypeDefinition>>(`/${code}`, body)
}

export const deleteTransTypeDefinition = (code: string) => {
  return transTypeDefinitionsService.delete<BaseResponse<void>>(`/${code}`)
}

export const getTransTypeDropdown = () => {
  return transTypeDefinitionsService.get<BaseResponse<TransTypeDropdownResponse[]>>('/dropdown')
}