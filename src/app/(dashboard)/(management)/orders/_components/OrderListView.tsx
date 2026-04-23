'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, Tag, Space, Button, Typography, Card, Row, Col,
  Select, DatePicker, Input, message, Popconfirm,
} from 'antd'
import {
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, PlusOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchOrders,
  confirmOrder,
  rejectOrder,
  completeOrder,
  handoverOrderToCarrier,
  markOrderDeliveryFailed,
  markOrderDeliveryCancelled,
  markOrderReturned,
  type OrderPojo,
  type OrderSearchParams,
} from '@/services/rest-api/app-api/orders/order-service'
import {
  FULFILLMENT_STATUS_CONFIG,
  FULFILLMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_STATUS_OPTIONS,
  getAvailableOrderActions,
  normalizeFulfillmentStatus,
  normalizePaymentStatus,
  type OrderStatusAction,
} from '@/constants/order-status'
import AppTable from '@/shared/components/antd/AppTable'
import { addNewOrderListener } from '@/shared/notifications/admin-notification-events'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── OrderListView ────────────────────────────────────────────────

const OrderListView: React.FC = () => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<OrderSearchParams>>({
    page: 1,
    size: 20,
  })
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading, mutate } = useAxiosSWR<{
    items: OrderPojo[]
    totalCount: number
  }>(
    [SWR_KEYS.ORDER_LIST, queryParams],
    async () => {
      const res = await searchOrders(queryParams as OrderSearchParams)
      return {
        items: res.items ?? [],
        totalCount: res.totalCount ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  useEffect(() => {
    const unsubscribe = addNewOrderListener(() => {
      mutate()
    })
    return unsubscribe
  }, [mutate])

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, page, size }))
    mutate()
  }, [mutate])

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, [key]: value, page: 1 }))
    mutate()
  }, [mutate])

  const handleDateRange = useCallback(
    (dates: [unknown, unknown] | null) => {
      const dateFrom = dates?.[0] && dayjs.isDayjs(dates[0]) ? dates[0].format('YYYY-MM-DD') : undefined
      const dateTo = dates?.[1] && dayjs.isDayjs(dates[1]) ? dates[1].format('YYYY-MM-DD') : undefined
      setQueryParams((prev) => ({
        ...prev,
        dateFrom,
        dateTo,
        page: 1,
      }))
      mutate()
    },
    [mutate],
  )

  const handleStatusAction = async (
    orderId: number,
    action: OrderStatusAction,
    reason?: string,
  ) => {
    try {
      switch (action) {
        case 'confirm':  await confirmOrder(orderId); break
        case 'reject':    await rejectOrder(orderId, reason); break
        case 'handover': await handoverOrderToCarrier(orderId); break
        case 'complete':  await completeOrder(orderId); break
        case 'deliveryFailed': await markOrderDeliveryFailed(orderId); break
        case 'deliveryCancelled': await markOrderDeliveryCancelled(orderId, reason); break
        case 'markReturned': await markOrderReturned(orderId, reason); break
      }
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Cập nhật thất bại')
    }
  }

  const columns: ColumnsType<OrderPojo> = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number, record: OrderPojo) => <Text code>#{id ?? record.buyOrder}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      ellipsis: true,
      render: (_: unknown, record: OrderPojo) => {
        const name = record.customerName ||
          (record.customer ? `${record.customer.firstName ?? ''} ${record.customer.lastName ?? ''}`.trim() : '—')
        const contact = record.recipientPhone || record.customer?.phone1 || record.customerEmail || record.customer?.email || ''
        return (
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {contact}
            </Text>
          </div>
        )
      },
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Tổng tiền',
      key: 'total',
      width: 140,
      align: 'right',
      render: (_: unknown, record: OrderPojo) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(record.totalValue ?? record.total)}
        </Text>
      ),
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 180,
      render: (_: unknown, record: OrderPojo) => (
        <div>
          {(() => {
            const p = normalizePaymentStatus(record.paymentStatus)
            const cfg = PAYMENT_STATUS_CONFIG[p] ?? { color: 'default', label: p }
            return <Tag color={cfg.color}>{cfg.label}</Tag>
          })()}
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.paymentStatus ?? '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'fulfillmentStatus',
      key: 'status',
      width: 180,
      render: (_status: string, record: OrderPojo) => {
        const status = record.fulfillmentStatus ?? record.status
        const s = normalizeFulfillmentStatus(status)
        const cfg = FULFILLMENT_STATUS_CONFIG[s] ?? { color: 'default', label: status ?? s }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 140,
      render: (t: string) => t ? <Text copyable>{t}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: OrderPojo) => {
        const availableActions = getAvailableOrderActions(
          record.fulfillmentStatus ?? record.status,
          record.paymentStatus,
        )
        return (
          <Space size={4}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/orders/${record.id ?? record.buyOrder}`)}
              title="Xem chi tiết"
            />
            {/* Inline status actions */}
            {availableActions.includes('confirm') && (
              <>
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleStatusAction((record.id ?? record.buyOrder)!, 'confirm')}
                  title="Xác nhận"
                />
                <Popconfirm
                  title="Từ chối đơn hàng"
                  description={
                    <Input.TextArea
                      rows={2}
                      placeholder="Lý do từ chối..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  }
                  okText="Từ chối"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => {
                    handleStatusAction((record.id ?? record.buyOrder)!, 'reject', rejectReason)
                    setRejectReason('')
                  }}
                >
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    danger
                    title="Từ chối"
                  />
                </Popconfirm>
              </>
            )}
            {availableActions.includes('handover') && (
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => handleStatusAction((record.id ?? record.buyOrder)!, 'handover')}
                title="Bàn giao đơn vị vận chuyển"
              />
            )}
            {availableActions.includes('complete') && (
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => handleStatusAction((record.id ?? record.buyOrder)!, 'complete')}
                title="Hoàn tất giao hàng"
              />
            )}
            {availableActions.includes('deliveryFailed') && (
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleStatusAction((record.id ?? record.buyOrder)!, 'deliveryFailed')}
                title="Đánh dấu giao thất bại"
              />
            )}
            {availableActions.includes('deliveryCancelled') && (
              <Popconfirm
                title="Thu hồi vận chuyển"
                description={
                  <Input.TextArea
                    rows={2}
                    placeholder="Lý do thu hồi..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                }
                okText="Thu hồi"
                okButtonProps={{ danger: true }}
                onConfirm={() => {
                  handleStatusAction((record.id ?? record.buyOrder)!, 'deliveryCancelled', cancelReason)
                  setCancelReason('')
                }}
              >
                <Button
                  type="text"
                  danger
                  icon={<CloseCircleOutlined />}
                  title="Thu hồi vận chuyển"
                />
              </Popconfirm>
            )}
            {availableActions.includes('markReturned') && (
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => handleStatusAction((record.id ?? record.buyOrder)!, 'markReturned')}
                title="Đánh dấu hoàn hàng"
              />
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý đơn hàng</Title>
          <Text type="secondary">Danh sách và cập nhật trạng thái đơn hàng</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/orders/new')}
          style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
        >
          Tạo đơn hàng
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Tìm tên, SĐT..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(v) => handleFilter('customerName', v || undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              options={FULFILLMENT_STATUS_OPTIONS}
              onChange={(v) => handleFilter('fulfillmentStatus', v)}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Thanh toán"
              allowClear
              style={{ width: '100%' }}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(v) => handleFilter('paymentStatus', v)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={handleDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Mã vận đơn"
              allowClear
              onChange={(e) => handleFilter('trackingNumber', e.target.value || undefined)}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <AppTable
        rowKey={(record) => String(record.id ?? record.buyOrder)}
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} đơn hàng`,
          onChange: handleTableChange,
        }}
      />
    </>
  )
}

export default OrderListView