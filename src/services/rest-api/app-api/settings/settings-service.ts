import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const settingsService = createApiService(appApiIns, '/api/data/params')

export type ParamPojo = {
  id?: number
  category: string
  name: string
  value: string
}

export type ParamSearchParams = {
  category?: string
  name?: string
  pageIndex?: number
  pageSize?: number
}

export type ParamListResponse = {
  items: ParamPojo[]
  totalCount: number
  pageIndex: number
  pageSize: number
}

export const searchParams = (params?: ParamSearchParams) => {
  return settingsService.get<ParamListResponse>('', { params })
}

export const getParamById = (id: number) => {
  return settingsService.get<ParamPojo>(`/${id}`)
}

export const updateParam = (id: number, data: ParamPojo) => {
  return settingsService.put<void>(`/${id}`, data)
}

export const getParamsByCategory = async (category: string): Promise<ParamPojo[]> => {
  const response = await searchParams({ category, pageIndex: 0, pageSize: 100 })
  return response.items ?? []
}
