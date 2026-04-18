import type { BaseResponse, PageResponse } from '@/types/common'
import { commCyclesService } from './_service-instance'
import { CycleDefDropdownItem } from '@/services/rest-api/app-api/plans/plan'

export type CommCycle = {
  code: string
  name: string
  cycleType: number
  status: number
  closeTime?: string
  closeDay?: number
  description?: string
  createdDateTime?: string
}

export type CommCycleDropdown = {
  cycleDefId: number
  code: string
  name: string
  cycleType: number
}

export type CommCycleSearchParams = {
  code?: string
  name?: string
  cycleType?: number
  status?: number
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
}

export type CommCycleCreateRequest = {
  code: string
  name: string
  cycleType: number
  closeTime?: string
  closeDay?: number
  description?: string
}

export type CommCycleUpdateRequest = {
  name: string
  status: number
  cycleType: number
  closeTime: string
  closeDay: number
  description?: string
}

export const searchCommCycles = (params: CommCycleSearchParams) => {
  return commCyclesService.get<PageResponse<CommCycle>>('', { params })
}

export const createCommCycle = (body: CommCycleCreateRequest) => {
  return commCyclesService.post<BaseResponse<CommCycle>>('', body)
}

export const updateCommCycle = (code: string, body: CommCycleUpdateRequest) => {
  return commCyclesService.put<BaseResponse<CommCycle>>(`/${code}`, body)
}

export const deleteCommCycle = (code: string) => {
  return commCyclesService.delete<BaseResponse<void>>(`/${code}`)
}

export const getActiveCommCycles = () => {
  return commCyclesService.get<BaseResponse<CommCycleDropdown[]>>('/active')
}

export const getCycleDefDropdown = () => {
  return commCyclesService.get<BaseResponse<CycleDefDropdownItem[]>>('/dropdown')
}
