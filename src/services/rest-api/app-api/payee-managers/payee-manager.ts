import type { BaseResponse } from '@/types/common'
import { payeeManagersService } from './_service-instance'

export type PayeeManagerHistory = {
  id: number
  payeeId: number
  payeeCode: string
  payeeName: string
  managerId: number
  managerCode: string
  managerName: string
  effectDate?: string
  expireDate?: string
  status?: number
  statusName?: string
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
}

export type PayeeManagerUpsertRequest = {
  payeeId: number
  managerId: number
  effectDate: string
  expireDate?: string
  status?: number
}

export const listPayeeManagers = (payeeId: number) => {
  return payeeManagersService.get<BaseResponse<PayeeManagerHistory[]>>('', { params: { payeeId } })
}

export const getPayeeManager = (id: number) => {
  return payeeManagersService.get<BaseResponse<PayeeManagerHistory>>(`/${id}`)
}

export const createPayeeManager = (body: PayeeManagerUpsertRequest) => {
  return payeeManagersService.post<BaseResponse<PayeeManagerHistory>>('', body)
}

export const updatePayeeManager = (id: number, body: Partial<PayeeManagerUpsertRequest>) => {
  return payeeManagersService.put<BaseResponse<PayeeManagerHistory>>(`/${id}`, body)
}

export const deletePayeeManager = (id: number) => {
  return payeeManagersService.delete<BaseResponse<void>>(`/${id}`)
}
