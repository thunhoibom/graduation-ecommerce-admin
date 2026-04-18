import type { BaseResponse, PageResponse, SearchRequest } from '@/types/common'
import { incentiveGroupsService } from './_service-instance'

export type IncentiveGroup = {
  incentiveGrpId: number
  code: string
  name: string
  status: number
  description?: string
  createdDateTime?: string
}

export type IncentiveGroupDropdown = {
  incentiveGrpId: number
  code: string
  name: string
}

export type IncentiveGroupSearchParams = SearchRequest & {
  code?: string
  name?: string
  status?: number
}

export type IncentiveGroupCreateRequest = {
  code: string
  name: string
  description?: string
}

export type IncentiveGroupUpdateRequest = {
  name: string
  status?: number
  description?: string
}

export type TIncentiveGroupSearchParams = {
  page?: string
  size?: string
  sortField?: string
  sortDirection?: string
  sorts?: string
  code?: string
  name?: string
  status?: string
}

export type IncentiveGroupSearchFormValues = {
  code?: string
  name?: string
  status?: number | 'all'
}

export const searchIncentiveGroups = (params: IncentiveGroupSearchParams) => {
  return incentiveGroupsService.get<PageResponse<IncentiveGroup>>('', { params })
}

export const createIncentiveGroup = (body: IncentiveGroupCreateRequest) => {
  return incentiveGroupsService.post<BaseResponse<IncentiveGroup>>('', body)
}

export const updateIncentiveGroup = (
  code: string,
  body: IncentiveGroupUpdateRequest,
) => {
  return incentiveGroupsService.put<BaseResponse<IncentiveGroup>>(`/${code}`, body)
}

export const deleteIncentiveGroup = (code: string) => {
  return incentiveGroupsService.delete<BaseResponse<void>>(`/${code}`)
}

export const getActiveIncentiveGroups = () => {
  return incentiveGroupsService.get<BaseResponse<IncentiveGroupDropdown[]>>('/active')
}
