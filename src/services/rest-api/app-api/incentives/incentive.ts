import type { BaseResponse, PageResponse } from '@/types/common'
import { incentivesService } from './_service-instance'

export type Incentive = {
  incentiveId?: number
  code: string
  name: string
  incentiveGrpId?: number
  incentiveGrpName?: string
  incentiveGrpCode?: string
  status: number
  description?: string
  createdDateTime?: string
}

export type IncentiveDropdownItem = {
  incentiveId: number
  code: string
  name: string
}

export type IncentiveSearchParams = {
  code?: string
  name?: string
  incentiveGrpId?: number
  incentiveGrpCode?: string
  status?: number
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  sorts?: string
}

export type IncentiveCreateRequest = {
  code: string
  name: string
  incentiveGrpId?: number
  description?: string
}

export type IncentiveUpdateRequest = {
  name: string
  incentiveGrpId?: number
  status: number
  description?: string
}

export type TIncentiveSearchParams = {
  page?: string
  size?: string
  sortField?: string
  sortDirection?: string
  sorts?: string
  code?: string
  name?: string
  incentiveGrpId?: string
  status?: string
}

export type IncentiveSearchFormValues = {
  code?: string
  name?: string
  incentiveGrpId?: number | 'all'
  status?: number | 'all'
}

export const searchIncentives = (params: IncentiveSearchParams) => {
  return incentivesService.get<PageResponse<Incentive>>('', { params })
}

export const getIncentiveDropdown = () => {
  return incentivesService.get<BaseResponse<IncentiveDropdownItem[]>>('/dropdown')
}

export const createIncentive = (body: IncentiveCreateRequest) => {
  return incentivesService.post<BaseResponse<Incentive>>('', body)
}

export const updateIncentive = (code: string, body: IncentiveUpdateRequest) => {
  return incentivesService.put<BaseResponse<Incentive>>(`/${code}`, body)
}

export const deleteIncentive = (code: string) => {
  return incentivesService.delete<BaseResponse<void>>(`/${code}`)
}
