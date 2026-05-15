import dayjs from 'dayjs'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeFulfillmentStatus,
  normalizePaymentStatus,
} from '@/constants/order-status'
import {
  searchOrders,
  type OrderPojo,
  type OrderSearchParams,
} from '@/services/rest-api/app-api/orders/order-service'
import { downloadCSV, generateCSV } from '@/shared/utils/csv'

const EXPORT_PAGE_SIZE = 1000

const EXPORT_HEADERS = [
  'Mã đơn',
  'Khách hàng',
  'Liên hệ',
  'Ngày đặt',
  'Tổng tiền',
  'Thanh toán',
  'Trạng thái giao hàng',
  'Mã vận đơn',
]

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const getOrderId = (order: OrderPojo) => order.id ?? order.buyOrder ?? ''

const getCustomerName = (order: OrderPojo) => {
  if (order.customerName) return order.customerName
  if (!order.customer) return '—'
  return `${order.customer.firstName ?? ''} ${order.customer.lastName ?? ''}`.trim() || '—'
}

const getContact = (order: OrderPojo) =>
  order.recipientPhone ||
  order.customer?.phone1 ||
  order.customerEmail ||
  order.customer?.email ||
  ''

const getPaymentLabel = (order: OrderPojo) => {
  const status = normalizePaymentStatus(order.paymentStatus)
  return PAYMENT_STATUS_CONFIG[status]?.label ?? order.paymentStatus ?? status
}

const getFulfillmentLabel = (order: OrderPojo) => {
  const status = normalizeFulfillmentStatus(order.fulfillmentStatus ?? order.status)
  return FULFILLMENT_STATUS_CONFIG[status]?.label ?? order.fulfillmentStatus ?? order.status ?? status
}

export const buildOrderExportRows = (orders: OrderPojo[]) =>
  orders.map((order) => [
    getOrderId(order),
    getCustomerName(order),
    getContact(order),
    order.date ? dayjs(order.date).format('DD/MM/YYYY HH:mm') : '—',
    formatVND(order.totalValue ?? order.total),
    getPaymentLabel(order),
    getFulfillmentLabel(order),
    order.trackingNumber ?? '',
  ])

export const fetchOrdersForExport = async (params: OrderSearchParams): Promise<OrderPojo[]> => {
  const { pageIndex: _pageIndex, pageSize: _pageSize, ...filters } = params
  const items: OrderPojo[] = []
  let pageIndex = 0
  let totalCount = 0

  do {
    const response = await searchOrders({
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

export const exportOrderList = async (params: OrderSearchParams): Promise<number> => {
  const orders = await fetchOrdersForExport(params)
  if (orders.length === 0) {
    return 0
  }

  const csv = generateCSV(EXPORT_HEADERS, buildOrderExportRows(orders))
  downloadCSV(`don-hang_${dayjs().format('YYYY-MM-DD_HHmm')}`, csv)
  return orders.length
}
