import type { PageResponse } from '@/types/common'
import { transactionsService } from './_service-instance'

/**
 * API quản lý thông tin giao dịch – màn hình Quản lý thông tin giao dịch.
 * Mapping theo SCREEN_MAPPING_TRANSACTION_MANAGEMENT.md.
 */

export type TransactionResponse = {
  id: number
  createdDateTime?: string
  transTypeCode?: string
  transTypeName?: string
  transDatetime?: string
  productCode?: string
  vendorCode?: string
  vehiclePlate?: string
  etagNumber?: string
  orgTransId?: number
  chanelCode?: string
  payeeCode?: string
  saleAmount?: number
  quantity?: number
  accountNumber?: string
  customerCode?: string
  systemCode?: string
}

export type TransactionSearchParams = {
  systemCode?: string
  transTypeCode?: string
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
}

export const searchTransactions = (
  params: TransactionSearchParams,
): Promise<PageResponse<TransactionResponse>> => {
  return transactionsService.get<PageResponse<TransactionResponse>>('', { params })
}
