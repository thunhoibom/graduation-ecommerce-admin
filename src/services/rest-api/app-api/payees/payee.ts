import type { BaseResponse, PageResponse } from '@/types/common'
import { payeesService } from './_service-instance'

export type PayeeSummary = {
  id: number
  code: string
  vendorCode?: string
  refCode?: string
  name: string
  payeeTypeCode?: string
  phone?: string
  organizationCode?: string
  email?: string
  status?: number
  role?: string
  managerId?: number
  managerName?: string
  effectDate?: string
  expireDate?: string
  createdAt?: string
  /** Số CCCD / CMND. */
  idNo?: string
  /** Số tài khoản ngân hàng. */
  bankAccount?: string
  /** Tên ngân hàng thụ hưởng. */
  bankName?: string
  /** Nhóm đối tượng (INDIVIDUAL, ENTERPRISE, AGENCY, STAFF, COLLECTOR). */
  payeeGroup?: string
}

export type PayeeDetail = {
  id: number
  code: string
  name: string
  systemCode?: string
  payeeTypeCode?: string
  contactName?: string
  organizationCode?: string
  provinceCode?: string
  address?: string
  phone?: string
  email?: string
  taxCode?: string
  status?: number
  role?: string
  managerId?: number
  managerEffectDate?: string
  managerExpireDate?: string
  effectDate?: string
  expireDate?: string
  createdAt?: string
  /** Số CCCD / CMND. */
  idNo?: string
  /** Số tài khoản ngân hàng. */
  bankAccount?: string
  /** Tên ngân hàng thụ hưởng. */
  bankName?: string
}

export type PayeeUpdateRequest = {
  name?: string
  role?: string
  managerId?: number
  email?: string
  phone?: string
  address?: string
  status?: number
  effectDate?: string
  expireDate?: string
  /** Số CCCD / CMND. */
  idNo?: string
  /** Số tài khoản ngân hàng. */
  bankAccount?: string
  /** Tên ngân hàng thụ hưởng. */
  bankName?: string
}

export type PayeeSearchParams = {
  code?: string
  name?: string
  payeeTypeCode?: string
  phone?: string
  organizationCode?: string
  email?: string
  status?: number
  effectDateFrom?: string
  effectDateTo?: string
  expireDateFrom?: string
  expireDateTo?: string
  sortField?: string
  sortDirection?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export type PayeeTax = {
  payeeTaxId: number
  payeeId: number
  tax: number
  status?: number
  effectDate?: string
  expireDate?: string
  createdDateTime?: string
}

export type PayeeTaxUpsertRequest = {
  tax: number
  effectDate: string
  expireDate?: string
  status: number
}

export type PayeeManagerHistory = {
  id: number
  managerId: number
  managerCode: string
  managerName: string
  payeeId: number
  payeeCode: string
  payeeName: string
  effectDate?: string
  expireDate?: string
  status?: number
  createdBy?: string
  createdAt?: string
}

export type PayeeDropdown = {
  payeeId: number
  payeeCode: string
  payeeName: string
  payeeTypeCode: string
  organizationCode: string
}

export type PayeeDropdownAllItem = {
  id: number
  name: string
  refCode?: string
}

export const searchPayees = (params: PayeeSearchParams) => {
  return payeesService.get<PageResponse<PayeeSummary>>('/search', { params })
}

export const searchPayeesDropdown = (params?: {
  organizationCode?: string
  payeeTypeCode?: string
  /** Nhóm đối tượng (INDIVIDUAL, ENTERPRISE, AGENCY, STAFF, COLLECTOR). */
  payeeGroup?: string
}) => {
  return payeesService.get<BaseResponse<PayeeDropdownAllItem[]>>('/dropdown/all', { params })
}

export const getPayeeDropdown = () => {
  return payeesService.get<BaseResponse<PayeeDropdown[]>>('/dropdown')
}

export const getPayeesForTrial = (params: { planId: number; fromDate: string; toDate: string }) => {
  return payeesService.get<BaseResponse<PayeeDropdown[]>>('/trial', { params })
}

export const getPayeesForRecalculate = (params: {
  planId: number
  fromDate: string
  toDate: string
}) => {
  return payeesService.get<BaseResponse<PayeeDropdown[]>>('/recalculate', { params })
}

export const getPayeeDetail = (id: number) => {
  return payeesService.get<BaseResponse<PayeeDetail>>(`/${id}`)
}

export const listPayeeTaxes = (payeeId: number) => {
  return payeesService.get<BaseResponse<PayeeTax[]>>(`/${payeeId}/taxes`)
}

export const createPayeeTax = (payeeId: number, body: PayeeTaxUpsertRequest) => {
  return payeesService.post<BaseResponse<PayeeTax>>(`/${payeeId}/taxes`, body)
}

export const updatePayeeTax = (
  payeeId: number,
  taxId: number,
  body: PayeeTaxUpsertRequest,
) => {
  return payeesService.put<BaseResponse<PayeeTax>>(`/${payeeId}/taxes/${taxId}`, body)
}

export const copyPayeeTax = (
  payeeId: number,
  taxId: number,
  body: PayeeTaxUpsertRequest,
) => {
  return payeesService.post<BaseResponse<PayeeTax>>(`/${payeeId}/taxes/${taxId}/copy`, body)
}

export const deletePayeeTax = (payeeId: number, taxId: number) => {
  return payeesService.delete<BaseResponse<void>>(`/${payeeId}/taxes/${taxId}`)
}

export const getManagersDropdown = () => {
  return payeesService.get<BaseResponse<PayeeDropdown[]>>('/managers')
}

export const getPayeeManagerHistory = (payeeId: number) => {
  return payeesService.get<BaseResponse<PayeeManagerHistory[]>>(`/${payeeId}/manager-history`)
}

export const updatePayee = (id: number, payload: PayeeUpdateRequest) => {
  return payeesService.put<BaseResponse<PayeeDetail>>(`/${id}`, payload)
}

export const getPayeeApprovers = (role: string) => {
  return payeesService.get<BaseResponse<PayeeSummary[]>>('/approvers', {
    params: { role },
  })
}

export const getPayeeByUserName = (username: string) => {
  return payeesService.get<BaseResponse<PayeeSummary>>('/by-username', {
    params: { username },
  })
}
