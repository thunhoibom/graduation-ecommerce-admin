import type { BaseResponse, PageResponse } from '@/types/common'
import { profilesService } from './_service-instance'
import type { AxiosResponse } from 'axios'

export type ProfileSummary = {
  id: number
  code: string
  name: string
  payeeId?: number
  payeeName?: string
  organizationCode?: string
  organizationName?: string
  noVatAmount?: number
  vatAmount?: number
  tax?: number
  amount?: number
  status?: number
  payStatus?: number
  payMonth?: string
  createdAt?: string
}

export type ProfileSearchParams = {
  code?: string
  name?: string
  organizationCode?: string
  payeeId?: number
  status?: number
  payStatus?: number
  fromMonth?: string
  toMonth?: string
  sortField?: string
  sortDirection?: string
  page?: number
  size?: number
}

export type ProfileDetailItem = {
  id: number
  incentiveId?: number
  itemName?: string
  month?: string
  monthLabel?: string
  noVatAmount?: number
  amount?: number
  tax?: number
  vatAmount?: number
  maxAmount?: number
  commissionIds?: number[]
}

export type ProfileDetail = ProfileSummary & {
  details?: ProfileDetailItem[]
}

export type ProfileDetailRequest = {
  incentiveId: number
  month: string
  noVatAmount: number
  tax: number
  vatAmount: number
  incentiveQuota?: number
  commissionIds?: number[]
}

export type ProfileCreateRequest = {
  name: string
  payeeId: number
  organizationCode: string
  organizationName: string
  vatAmount: number
  amount: number
  tax: number
  details: ProfileDetailRequest[]
}

export type ProfileUpdateRequest = {
  name: string
  payeeId: number
  organizationCode: string
  organizationName: string
  vatAmount: number
  amount: number
  tax: number
  details: ProfileDetailRequest[]
}

export const searchProfiles = async (
  params: ProfileSearchParams,
): Promise<PageResponse<ProfileSummary>> => {
  return profilesService.get<PageResponse<ProfileSummary>>('', { params })
}

export const createProfile = async (
  body: ProfileCreateRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ProfileSummary>> => {
  return profilesService.post<BaseResponse<ProfileSummary>>('', body, {
    headers,
  })
}

export const updateProfile = async (
  id: number,
  body: ProfileUpdateRequest,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ProfileSummary>> => {
  return profilesService.put<BaseResponse<ProfileSummary>>(`/${id}`, body, {
    headers,
  })
}

export const deleteProfile = async (
  id: number,
): Promise<BaseResponse<string>> => {
  return profilesService.delete<BaseResponse<string>>(`/${id}`)
}

export const approveProfile = async (
  id: number,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ProfileSummary>> => {
  return profilesService.put<BaseResponse<ProfileSummary>>(`/${id}/approve`, {}, {
    headers,
  })
}

export const cancelApproveProfile = async (
  id: number,
  headers?: { 'X-User'?: string },
): Promise<BaseResponse<ProfileSummary>> => {
  return profilesService.put<BaseResponse<ProfileSummary>>(`/${id}/cancel-approve`, {}, {
    headers,
  })
}

export const getProfileDetail = async (
  id: number,
): Promise<BaseResponse<ProfileDetail>> => {
  return profilesService.get<BaseResponse<ProfileDetail>>(`/${id}`)
}

export type ProfileCommissionExportRequest = {
  payeeId: number
  items: {
    incentiveId: number
    month: string
    commissionIds?: number[]
  }[]
}


export const exportCommissions = async (
  body: ProfileCommissionExportRequest,
): Promise<AxiosResponse<Blob>> => {
  return profilesService.post('/export-commissions', body, {
    responseType: 'blob',
  })
}

