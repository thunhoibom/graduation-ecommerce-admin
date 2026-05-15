'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Table, Tag, Button, Space,
  Divider, Spin, Breadcrumb, Row, Col, message, Timeline, Alert,
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SyncOutlined, PrinterOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getOrderById,
  confirmOrder,
  rejectOrder,
  completeOrder,
  handoverOrderToCarrier,
  markOrderDeliveryFailed,
  markOrderDeliveryCancelled,
  markOrderReturned,
  getOrderShipmentTracking,
  type ShipmentTrackingItem,
  type OrderPojo,
  type OrderDetailPojo,
} from '@/services/rest-api/app-api/orders/order-service'
import { searchReturns } from '@/services/rest-api/app-api/returns/return-service'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  getAvailableOrderActions,
  normalizeFulfillmentStatus,
  type OrderStatusAction,
} from '@/constants/order-status'
import {
  canCustomerRequestReturn,
  getOrderRefundedAmount,
  getOrderTotalAmount,
  resolveOrderPaymentStatus,
} from '@/lib/order-refund'

const { Title, Text, Paragraph } = Typography

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (d: string | undefined) =>
  d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'

// ── Resolve helpers ─────────────────────────────────────────────

const resolveCustomerName = (order: OrderPojo): string => {
  if (order.customer?.firstName || order.customer?.lastName)
    return [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ')
  return order.customerName ?? '—'
}

const resolveCustomerEmail = (order: OrderPojo): string =>
  order.customer?.email ?? order.customerEmail ?? '—'

const resolveCustomerPhone = (order: OrderPojo): string =>
  order.customer?.phone1 ?? order.recipientPhone ?? '—'

const resolveShippingAddress = (order: OrderPojo): string => {
  if (typeof order.shippingAddress === 'object' && order.shippingAddress) {
    const a = order.shippingAddress
    return [a.address1, a.ward, a.district, a.city].filter(Boolean).join(', ')
  }
  return [order.shippingAddress, order.shippingWard, order.shippingDistrict, order.shippingCity]
    .filter(Boolean).join(', ') || '—'
}

// ── OrderDetailView ─────────────────────────────────────────────

interface OrderDetailViewProps {
  orderId: number
}

const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: order, isLoading, mutate } = useAxiosSWR<OrderPojo>(
    [SWR_KEYS.ORDER_DETAIL, orderId],
    async () => getOrderById(orderId),
    { revalidateOnMount: true },
  )
  const { data: trackingHistory } = useAxiosSWR<ShipmentTrackingItem[]>(
    [SWR_KEYS.ORDER_DETAIL, 'tracking', orderId],
    async () => getOrderShipmentTracking(orderId),
    { revalidateOnMount: true },
  )
  const { data: returnRequestsPage } = useAxiosSWR(
    [SWR_KEYS.RETURN_LIST, 'order', orderId],
    async () => searchReturns({ orderId, pageIndex: 0, pageSize: 5 }),
    { revalidateOnMount: true },
  )

  const handleAction = async (
    action: OrderStatusAction,
    reason?: string,
  ) => {
    try {
      switch (action) {
        case 'confirm': await confirmOrder(orderId); break
        case 'reject': await rejectOrder(orderId, reason); break
        case 'handover': await handoverOrderToCarrier(orderId); break
        case 'complete': await completeOrder(orderId); break
        case 'deliveryFailed': await markOrderDeliveryFailed(orderId); break
        case 'deliveryCancelled': await markOrderDeliveryCancelled(orderId, reason); break
        case 'markReturned': await markOrderReturned(orderId, reason); break
      }
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">Không tìm thấy đơn hàng</Text>
      </div>
    )
  }

  const fulfillmentStatus = order.fulfillmentStatus ?? order.status
  const paymentStatus = order.paymentStatus
  const s = normalizeFulfillmentStatus(fulfillmentStatus)
  const cfg = FULFILLMENT_STATUS_CONFIG[s] ?? { color: 'default', label: fulfillmentStatus ?? s }
  const latestTracking = trackingHistory?.[0]
  const returnRequests = returnRequestsPage?.items ?? []
  const refundedAmount = getOrderRefundedAmount(order)
  const orderTotalAmount = getOrderTotalAmount(order)
  const resolvedPaymentStatus = resolveOrderPaymentStatus(order)
  const paymentCfg = PAYMENT_STATUS_CONFIG[resolvedPaymentStatus] ?? {
    color: 'default',
    label: resolvedPaymentStatus,
  }
  const customerCanRequestReturn = canCustomerRequestReturn(order)

  const itemColumns: ColumnsType<OrderDetailPojo> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: unknown, record: OrderDetailPojo) => (
        <div>
          <Text strong>{record.product?.name ?? '—'}</Text>
          <br />
          <Space size={4} split={<Divider type="vertical" />} style={{ fontSize: 12 }}>
            {record.variant?.sku && <Tag color="blue" style={{ margin: 0 }}>{record.variant.sku}</Tag>}
            {record.variant?.size && <Text type="secondary">Size: {record.variant.size}</Text>}
            {record.variant?.color && <Text type="secondary">Màu: {record.variant.color}</Text>}
          </Space>
          {!record.variant && record.product?.barcode && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.product.barcode}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: OrderDetailPojo) => {
        const img = record.variant?.primaryImageUrl || record.product?.images?.[0]?.url
        if (!img) return <div style={{ width: 56, height: 56, background: '#f0f0f0', borderRadius: 4 }} />
        return (
          <img
            src={img}
            alt=""
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }}
          />
        )
      },
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitValue',
      key: 'unitValue',
      width: 130,
      align: 'right' as const,
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Số lượng',
      dataIndex: 'units',
      key: 'units',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Thành tiền',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: OrderDetailPojo) => (
        <Text strong>{formatVND((record.units ?? 0) * (record.unitValue ?? 0))}</Text>
      ),
    },
  ]

  // ── Action buttons by status ──────────────────────────────────
  const actionButtons = () => {
    const availableActions = getAvailableOrderActions(
      fulfillmentStatus,
      paymentStatus,
      order?.paymentType ?? order?.paymentMethod,
    )
    if (availableActions.includes('confirm')) {
      return (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction('confirm')}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Xác nhận đơn
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleAction('reject', 'Từ chối đơn hàng')}
          >
            Từ chối
          </Button>
        </Space>
      )
    }
    if (availableActions.includes('handover')) {
      return (
        <Button
          type="primary"
          icon={<SyncOutlined />}
          onClick={() => handleAction('handover')}
        >
          Bàn giao cho ĐVVC
        </Button>
      )
    }
    if (availableActions.includes('complete') || availableActions.includes('deliveryCancelled')) {
      return (
        <Space>
          {availableActions.includes('complete') && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => handleAction('complete')}
            >
              Hoàn tất giao hàng
            </Button>
          )}
          {availableActions.includes('deliveryCancelled') && (
            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleAction('deliveryCancelled', 'Thu hồi vận chuyển')}>
              Thu hồi đơn
            </Button>
          )}
        </Space>
      )
    }
    if (availableActions.includes('markReturned')) {
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Cập nhật vận chuyển"
            description="Chỉ dùng khi ĐVVC đã hoàn hàng về kho."
          />
          <Button icon={<SyncOutlined />} onClick={() => handleAction('markReturned')}>
            Đánh dấu hoàn vận chuyển
          </Button>
        </Space>
      )
    }
    return (
      <Button
        icon={<EditOutlined />}
        onClick={() => router.push(`/orders/${orderId}/edit-status`)}
      >
        Chỉnh sửa trạng thái
      </Button>
    )
  }

  return (
    <>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/orders/list')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/orders/list')}>Đơn hàng</a> },
            { title: `#${orderId}` },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/orders/list')}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Đơn hàng #{orderId}
          </Title>
          <Tag color={cfg.color} style={{ fontSize: 13, padding: '2px 10px' }}>
            {cfg.label}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Left column ── */}
        <Col xs={24} lg={15}>
          {/* Order items */}
          <Card title="Sản phẩm đã đặt" style={{ marginBottom: 16 }}>
            <Table
              dataSource={order.details ?? []}
              rowKey="id"
              columns={itemColumns}
              pagination={false}
              size="middle"
              scroll={{ x: 600 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text>Tạm tính</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{formatVND(order.subtotal ?? order.netValue)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {order.discountValue != null && order.discountValue > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Giảm giá {order.discountCode && `(${order.discountCode})`}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="secondary" style={{ color: '#ff4d4f' }}>
                          -{formatVND(order.discountValue)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.transportValue != null && order.transportValue > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Phí vận chuyển</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="secondary">+{formatVND(order.transportValue)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.taxValue != null && order.taxValue > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Thuế</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="secondary">+{formatVND(order.taxValue)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text strong style={{ fontSize: 15 }}>Tổng cộng</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 15, color: '#52c41a' }}>
                        {formatVND(order.totalValue ?? order.total)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Shipping address */}
          <Card title="Địa chỉ giao hàng" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Người nhận">{order.recipientName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{order.recipientPhone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.recipientEmail ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{resolveShippingAddress(order)}</Descriptions.Item>
              <Descriptions.Item label="Phương thức">{order.shippingMethod ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Mã vận đơn">
                {order.trackingNumber ? (
                  <Text copyable style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</Text>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="ĐVVC">
                {latestTracking?.shipperCode ?? <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái GHN mới nhất">
                {latestTracking?.status ? (
                  <Tag color="processing">{latestTracking.status}</Tag>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật vận chuyển">
                {latestTracking?.eventTime ? formatDate(latestTracking.eventTime) : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Shipment tracking timeline */}
          <Card title="Lịch sử vận chuyển" style={{ marginBottom: 16 }}>
            {trackingHistory && trackingHistory.length > 0 ? (
              <Timeline
                items={trackingHistory.map((item) => ({
                  color: item.status?.toUpperCase() === 'DELIVERED' ? 'green' : 'blue',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Space size={8} wrap>
                        <Tag color="processing">{item.status}</Tag>
                        {item.eventTime && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDate(item.eventTime)}
                          </Text>
                        )}
                      </Space>
                      {item.location && (
                        <Text style={{ fontSize: 13 }}>{item.location}</Text>
                      )}
                      {item.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.description}
                        </Text>
                      )}
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Text type="secondary">Chưa có lịch sử vận chuyển.</Text>
            )}
          </Card>

          {/* Notes */}
          {(order.notes || order.discountCode) && (
            <Card title="Ghi chú & Mã giảm giá" style={{ marginBottom: 16 }}>
              {order.discountCode && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Mã giảm giá: </Text>
                  <Text code>{order.discountCode}</Text>
                </div>
              )}
              {order.notes && <Paragraph>{order.notes}</Paragraph>}
            </Card>
          )}
        </Col>

        {/* ── Right column ── */}
        <Col xs={24} lg={9}>
          {returnRequests.length > 0 && (
            <Card title="Yêu cầu trả hàng" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {returnRequests.map((request) => {
                  const requestId = request.id
                  if (!requestId) return null
                  return (
                    <Button
                      key={requestId}
                      type="link"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => router.push(`/returns/${requestId}`)}
                    >
                      #{requestId} · {request.status ?? '—'}
                    </Button>
                  )
                })}
              </Space>
            </Card>
          )}


          {/* Actions */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Thao tác</Text>
              {actionButtons()}
            </div>
          </Card>

          {/* Customer info */}
          <Card title="Khách hàng" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên">
                {order.customer ? (
                  <a onClick={() => router.push(`/customers/${order.customer!.id}/detail`)}>
                    {resolveCustomerName(order)}
                  </a>
                ) : resolveCustomerName(order)}
              </Descriptions.Item>
              <Descriptions.Item label="Email">{resolveCustomerEmail(order)}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{resolveCustomerPhone(order)}</Descriptions.Item>
              {order.billingCompany && (
                <Descriptions.Item label="Công ty">
                  {typeof order.billingCompany === 'string'
                    ? order.billingCompany
                    : order.billingCompany.name}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Order summary */}
          <Card title="Thông tin đơn hàng">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã đơn">
                <Text code>#{orderId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">{formatDate(order.date)}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {formatDate(order.lastModified)}
              </Descriptions.Item>
              <Descriptions.Item label="Số sản phẩm">{order.totalItems ?? order.details?.length ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={paymentCfg.color}>{paymentCfg.label}</Tag>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {order.paymentType ?? order.paymentMethod ?? '—'}
                </Text>
              </Descriptions.Item>
              {refundedAmount > 0 && (
                <Descriptions.Item label="Đã hoàn">
                  <Text strong style={{ color: '#cf1322' }}>{formatVND(refundedAmount)}</Text>
                  {orderTotalAmount > 0 && refundedAmount < orderTotalAmount && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Còn lại {formatVND(orderTotalAmount - refundedAmount)}
                      </Text>
                    </>
                  )}
                </Descriptions.Item>
              )}
              {order.shipper && (
                <Descriptions.Item label="Người giao hàng">{order.shipper}</Descriptions.Item>
              )}
              {order.buyOrder && (
                <Descriptions.Item label="Mã giao dịch">
                  <Text code>{order.buyOrder}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default OrderDetailView
