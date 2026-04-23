'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Tag, Button, Space, Steps,
  Form, Input, Select, message, Breadcrumb, Spin, Divider,
  Alert, Row, Col, Table,
} from 'antd'
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, CarOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  SendOutlined,
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
  updateOrder,
  type OrderPojo,
} from '@/services/rest-api/app-api/orders/order-service'
import {
  FULFILLMENT_STATUS_CONFIG,
  FULFILLMENT_STATUS_PIPELINE,
  PAYMENT_STATUS_CONFIG,
  TERMINAL_FULFILLMENT_STATUSES,
  getAvailableOrderActions,
  normalizeFulfillmentStatus,
  normalizePaymentStatus,
  type OrderStatusAction,
} from '@/constants/order-status'

const { Title, Text, Paragraph } = Typography

const STEP_ICON_MAP: Record<string, React.ReactNode> = {
  PENDING: <ClockCircleOutlined />,
  CONFIRMED: <ExclamationCircleOutlined />,
  DELIVERY_ON_ROUTE: <CarOutlined />,
  DELIVERY_COMPLETE: <CheckCircleOutlined />,
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── OrderStatusView ─────────────────────────────────────────────

interface OrderStatusViewProps {
  orderId: number
}

const OrderStatusView: React.FC<OrderStatusViewProps> = ({ orderId }) => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [submitting, setSubmitting] = useState(false)
  const [reason, setReason] = useState('')

  const { data: order, isLoading, mutate } = useAxiosSWR<OrderPojo>(
    [SWR_KEYS.ORDER_DETAIL, orderId],
    async () => getOrderById(orderId),
    { revalidateOnMount: true },
  )

  const fulfillmentStatus = order?.fulfillmentStatus ?? order?.status
  const s = normalizeFulfillmentStatus(fulfillmentStatus)
  const currentIdx = FULFILLMENT_STATUS_PIPELINE.findIndex((statusKey) => statusKey === s)
  const isTerminal = TERMINAL_FULFILLMENT_STATUSES.includes(s)
  const availableActions = getAvailableOrderActions(fulfillmentStatus, order?.paymentStatus)

  // ── Action handlers ──────────────────────────────────────────

  const handleAction = async (
    action: OrderStatusAction | 'updateTracking',
  ) => {
    setSubmitting(true)
    try {
      switch (action) {
        case 'confirm':
          await confirmOrder(orderId)
          messageApi.success('Đã xác nhận đơn hàng')
          break
        case 'reject':
          if (!reason.trim()) {
            messageApi.error('Vui lòng nhập lý do từ chối')
            setSubmitting(false)
            return
          }
          await rejectOrder(orderId, reason)
          messageApi.success('Đã từ chối đơn hàng')
          break
        case 'complete':
          await completeOrder(orderId)
          messageApi.success('Đã hoàn tất giao hàng')
          break
        case 'handover':
          await handoverOrderToCarrier(orderId)
          messageApi.success('Đã chuyển trạng thái giao hàng')
          break
        case 'deliveryFailed':
          await markOrderDeliveryFailed(orderId)
          messageApi.success('Đã đánh dấu giao thất bại')
          break
        case 'deliveryCancelled':
          await markOrderDeliveryCancelled(orderId, reason)
          messageApi.success('Đã đánh dấu thu hồi giao hàng')
          break
        case 'markReturned':
          await markOrderReturned(orderId, reason)
          messageApi.success('Đã cập nhật trạng thái hoàn hàng')
          break
        case 'updateTracking':
          if (!reason.trim()) {
            messageApi.error('Vui lòng nhập mã vận đơn')
            setSubmitting(false)
            return
          }
          await updateOrder(orderId, { trackingNumber: reason } as OrderPojo)
          messageApi.success('Cập nhật mã vận đơn thành công')
          break
      }
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại, vui lòng thử lại')
    } finally {
      setSubmitting(false)
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

  const cfg = FULFILLMENT_STATUS_CONFIG[s] ?? { color: 'default', label: fulfillmentStatus ?? s }

  return (
    <>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/orders/list')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/orders/list')}>Đơn hàng</a> },
            { title: <a onClick={() => router.push(`/orders/${orderId}`)}>#{orderId}</a> },
            { title: 'Cập nhật trạng thái' },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/orders/${orderId}`)}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Cập nhật trạng thái — Đơn #{orderId}
          </Title>
          <Tag color={cfg.color} style={{ fontSize: 13, padding: '2px 10px' }}>
            {cfg.label}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Left: Status pipeline ── */}
        <Col xs={24} lg={16}>
          {/* Pipeline stepper */}
          {!isTerminal ? (
            <Card
              title="Trạng thái đơn hàng"
              style={{ marginBottom: 16 }}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ngày đặt: {order.date ? dayjs(order.date).format('DD/MM/YYYY HH:mm') : '—'}
                </Text>
              }
            >
              <Steps
                current={currentIdx >= 0 ? currentIdx : 0}
                size="small"
                items={FULFILLMENT_STATUS_PIPELINE.map((statusKey, idx) => ({
                  title: FULFILLMENT_STATUS_CONFIG[statusKey]?.label ?? statusKey,
                  icon: STEP_ICON_MAP[statusKey],
                  status: idx < currentIdx
                    ? 'finish'
                    : idx === currentIdx
                      ? 'process'
                      : 'wait',
                }))}
                style={{ marginBottom: 24 }}
              />

              <Divider />

              {/* Action panel */}
              <div>
                {availableActions.includes('confirm') && (
                  <>
                    <Alert
                      message="Xác nhận hoặc từ chối đơn hàng"
                      description="Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái Đã xác nhận và bắt đầu đóng gói."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleAction('confirm')}
                          loading={submitting}
                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                          Xác nhận đơn hàng
                        </Button>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleAction('reject')}
                          loading={submitting}
                        >
                          Từ chối đơn hàng
                        </Button>
                      </Space>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          Lý do từ chối (bắt buộc nếu từ chối):
                        </Text>
                        <Input.TextArea
                          rows={2}
                          placeholder="Nhập lý do..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          style={{ maxWidth: 480 }}
                        />
                      </div>
                    </Space>
                  </>
                )}

                {availableActions.includes('handover') && (
                  <>
                    <Alert
                      message="Bàn giao cho đơn vị vận chuyển"
                      description="Đơn hàng chuyển sang trạng thái đang giao hàng. Sau bước này có thể đánh dấu giao thành công hoặc giao thất bại."
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Button
                      type="primary"
                      icon={<SyncOutlined />}
                      onClick={() => handleAction('handover')}
                      loading={submitting}
                    >
                      Bàn giao vận chuyển
                    </Button>
                  </>
                )}

                {availableActions.includes('complete') && (
                  <>
                    <Alert
                      message="Đang trong quá trình giao"
                      description="Chọn kết quả giao hàng phù hợp để cập nhật trạng thái đơn."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleAction('complete')}
                        loading={submitting}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Giao thành công
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleAction('deliveryFailed')}
                        loading={submitting}
                      >
                        Giao thất bại
                      </Button>
                      <Button
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleAction('deliveryCancelled')}
                        loading={submitting}
                      >
                        Thu hồi giao hàng
                      </Button>
                    </Space>
                  </>
                )}

                {availableActions.includes('markReturned') && (
                  <Alert
                    message="Hoàn hàng về kho"
                    description="Đơn đã kết thúc giao vận nhưng phát sinh hoàn hàng. Nhấn nút dưới để chuyển trạng thái Returned."
                    type="warning"
                    showIcon
                    action={
                      <Button size="small" onClick={() => handleAction('markReturned')} loading={submitting}>
                        Đánh dấu hoàn hàng
                      </Button>
                    }
                  />
                )}

                {(s === 'DELIVERY_COMPLETE') && (
                  <Alert
                    message="Đơn hàng đã hoàn tất"
                    description="Đơn hàng đã được giao thành công và thu tiền. Không cần thực hiện thêm thao tác nào."
                    type="success"
                    showIcon
                  />
                )}
              </div>
            </Card>
          ) : (
            <Card
              title="Trạng thái đơn hàng"
              style={{ marginBottom: 16 }}
              extra={<Tag color={cfg.color}>{cfg.label}</Tag>}
            >
              <Alert
                message={`Đơn hàng đã ở trạng thái kết thúc: ${cfg.label}`}
                description={
                  s === 'RETURNED'
                      ? 'Đơn hàng đã được trả lại.'
                    : order.paymentStatus === 'PAYMENT_FAILED' || order.paymentStatus === 'PAYMENT_CANCELLED'
                      ? 'Đơn hàng kết thúc ở bước thanh toán, không thể xử lý tiếp.'
                      : 'Đơn hàng kết thúc ở trạng thái từ chối.'
                }
                type={order.paymentStatus === 'PAYMENT_FAILED' || order.paymentStatus === 'PAYMENT_CANCELLED' ? 'error' : 'info'}
                showIcon
              />
            </Card>
          )}

          {/* Update tracking & notes */}
          <Card title="Thông tin bổ sung" style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Form.Item label="Mã vận đơn">
                <Input
                  placeholder="Nhập mã vận đơn..."
                  value={order.trackingNumber ?? ''}
                  onChange={(e) => setReason(e.target.value)}
                  addonAfter={
                    <Button
                      size="small"
                      icon={<SendOutlined />}
                      onClick={() => handleAction('updateTracking')}
                      loading={submitting}
                      disabled={!reason.trim()}
                    >
                      Cập nhật
                    </Button>
                  }
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Notes */}
          <Card title="Ghi chú nội bộ">
            <Input.TextArea
              rows={3}
              placeholder="Thêm ghi chú cho đơn hàng..."
              defaultValue={order.notes ?? ''}
              onBlur={async (e) => {
                if (e.target.value !== (order.notes ?? '')) {
                  try {
                    await updateOrder(orderId, { notes: e.target.value } as OrderPojo)
                    mutate()
                  } catch {
                    messageApi.error('Lưu ghi chú thất bại')
                  }
                }
              }}
            />
          </Card>
        </Col>

        {/* ── Right: Summary ── */}
        <Col xs={24} lg={8}>
          {/* Order quick summary */}
          <Card title="Thông tin đơn hàng" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã đơn">
                <Text code>#{orderId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {order.customer?.firstName || order.customerName
                  ? [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#52c41a' }}>
                  {formatVND(order.totalValue ?? order.total)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {(() => {
                  const p = normalizePaymentStatus(order.paymentStatus)
                  const pCfg = PAYMENT_STATUS_CONFIG[p] ?? { color: 'default', label: p }
                  return <Tag color={pCfg.color}>{pCfg.label}</Tag>
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Mã vận đơn">
                {order.trackingNumber
                  ? <Text copyable>{order.trackingNumber}</Text>
                  : <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {order.lastModified
                  ? dayjs(order.lastModified).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Items preview */}
          <Card title="Sản phẩm" extra={
            <a onClick={() => router.push(`/orders/${orderId}`)}>Chi tiết →</a>
          }>
            <Table
              dataSource={(order.details ?? []).slice(0, 3)}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Sản phẩm',
                  key: 'product',
                  render: (_: unknown, record) => (
                    <Text ellipsis style={{ maxWidth: 160 }}>{record.product?.name ?? '—'}</Text>
                  ),
                },
                {
                  title: 'SL',
                  dataIndex: 'units',
                  width: 40,
                  align: 'center' as const,
                },
                {
                  title: 'T.Tiền',
                  key: 'total',
                  width: 80,
                  align: 'right' as const,
                  render: (_: unknown, record) => (
                    <Text style={{ fontSize: 12 }}>
                      {formatVND((record.units ?? 0) * (record.unitValue ?? 0))}
                    </Text>
                  ),
                },
              ]}
            />
            {(order.details?.length ?? 0) > 3 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{order.details!.length - 3} sản phẩm khác
              </Text>
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default OrderStatusView