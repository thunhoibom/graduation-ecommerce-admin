import dayjs from 'dayjs'
import {
  listPurchaseOrders,
  type PurchaseOrderPojo,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'
import { downloadCSV, generateCSV } from '@/shared/utils/csv'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PARTIALLY_RECEIVED: 'Nhập một phần',
  RECEIVED: 'Đã nhận đủ',
  CANCELLED: 'Đã hủy',
}

const EXPORT_HEADERS = [
  'Mã PO',
  'Nhà cung cấp',
  'Trạng thái',
  'Số dòng',
  'Tổng giá trị đặt',
  'Giá trị đã nhập',
  'Ngày tạo',
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

export const buildPurchaseOrderExportRows = (orders: PurchaseOrderPojo[]) =>
  orders.map((order) => [
    order.code,
    order.supplierName ?? '',
    STATUS_LABEL[order.status] ?? order.status,
    order.lineCount ?? order.lines?.length ?? 0,
    formatVND(order.orderedTotalAmount),
    formatVND(order.receivedTotalAmount),
    formatDate(order.createdAt),
  ])

export const fetchPurchaseOrdersForExport = async (status?: string): Promise<PurchaseOrderPojo[]> =>
  listPurchaseOrders(status)

export const exportPurchaseOrderList = async (status?: string): Promise<number> => {
  const orders = await fetchPurchaseOrdersForExport(status)
  if (orders.length === 0) {
    return 0
  }

  const csv = generateCSV(EXPORT_HEADERS, buildPurchaseOrderExportRows(orders))
  downloadCSV(`don-dat-hang-mua_${dayjs().format('YYYY-MM-DD_HHmm')}`, csv)
  return orders.length
}
