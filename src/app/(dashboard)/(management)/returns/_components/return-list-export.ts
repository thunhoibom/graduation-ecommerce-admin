import dayjs from 'dayjs'
import {
  searchReturns,
  type ReturnRequestPojo,
  type ReturnSearchParams,
} from '@/services/rest-api/app-api/returns/return-service'
import { downloadCSV, generateCSV } from '@/shared/utils/csv'
import { formatReturnReason } from '@/lib/return-reason'

const EXPORT_PAGE_SIZE = 1000

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  RECEIVED: 'Đã nhận hàng',
  REFUND_PROCESSING: 'Đang hoàn tiền',
  REFUND_COMPLETED: 'Hoàn tiền xong',
  CANCELLED: 'Đã hủy',
}

const REFUND_METHOD_LABEL: Record<string, string> = {
  ORIGINAL_PAYMENT: 'Hoàn về thanh toán gốc',
  STORE_CREDIT: 'Tín dụng cửa hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

const QC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ kiểm tra',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
}

const EXPORT_HEADERS = [
  'Mã yêu cầu',
  'Mã đơn hàng',
  'Khách hàng',
  'Liên hệ',
  'Ngày yêu cầu',
  'Lý do',
  'Số mặt hàng',
  'Số lượng SP',
  'Hoàn tiền',
  'Phương thức hoàn',
  'Trạng thái',
  'QC kho',
  'Mã vận đơn trả',
  'Cập nhật cuối',
  'Hoàn tiền lúc',
]

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')

const getReturnItemSummary = (record: ReturnRequestPojo) => {
  const lineCount = record.items?.length ?? 0
  const quantity = record.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0
  return { lineCount, quantity }
}

const getCustomerName = (record: ReturnRequestPojo) =>
  record.orderRecipientName || record.order?.recipientName || '—'

const getContact = (record: ReturnRequestPojo) =>
  record.orderRecipientPhone || record.order?.recipientPhone || ''

export const buildReturnExportRows = (returns: ReturnRequestPojo[]) =>
  returns.map((record) => {
    const { lineCount, quantity } = getReturnItemSummary(record)
    const status = record.status ?? ''
    const qcStatus = record.qcStatus ?? ''

    return [
      record.id ?? '',
      record.orderId ?? '',
      getCustomerName(record),
      getContact(record),
      formatDate(record.date),
      formatReturnReason(record.reason),
      lineCount,
      quantity,
      formatVND(record.refundAmount),
      REFUND_METHOD_LABEL[record.refundMethod ?? ''] ?? record.refundMethod ?? '—',
      STATUS_LABEL[status] ?? status,
      qcStatus ? (QC_STATUS_LABEL[qcStatus] ?? qcStatus) : '—',
      record.trackingNumber ?? '',
      formatDate(record.lastModified),
      formatDate(record.refundedAt),
    ]
  })

export const fetchReturnsForExport = async (params: ReturnSearchParams): Promise<ReturnRequestPojo[]> => {
  const { pageIndex: _pageIndex, pageSize: _pageSize, ...filters } = params
  const items: ReturnRequestPojo[] = []
  let pageIndex = 0
  let totalCount = 0

  do {
    const response = await searchReturns({
      ...filters,
      pageIndex,
      pageSize: EXPORT_PAGE_SIZE,
    })
    totalCount = response.totalCount ?? 0
    items.push(...(response.items ?? []))
    pageIndex += 1
  } while (items.length < totalCount)

  return items
}

export const exportReturnList = async (params: ReturnSearchParams): Promise<number> => {
  const returns = await fetchReturnsForExport(params)
  if (returns.length === 0) {
    return 0
  }

  const csv = generateCSV(EXPORT_HEADERS, buildReturnExportRows(returns))
  downloadCSV(`yeu-cau-tra-hang_${dayjs().format('YYYY-MM-DD_HHmm')}`, csv)
  return returns.length
}
