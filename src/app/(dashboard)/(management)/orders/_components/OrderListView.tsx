'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, Tag, Space, Button, Typography, Card, Row, Col,
  Select, DatePicker, Input, message, Dropdown, Modal,
} from 'antd'
import {
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, PlusOutlined, SearchOutlined, DownOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
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
    pageIndex: 0,
    pageSize: 20,
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
    setQueryParams((prev) => ({ ...prev, pageIndex: Math.max(0, page - 1), pageSize: size }))
    mutate()
  }, [mutate])

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, [key]: value, pageIndex: 0 }))
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
        pageIndex: 0,
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

  const openReasonModal = (
    title: string,
    placeholder: string,
    onSubmit: (reason: string) => void,
  ) => {
    let reason = ''
    Modal.confirm({
      title,
      content: (
        <Input.TextArea
          rows={3}
          placeholder={placeholder}
          onChange={(e) => {
            reason = e.target.value
          }}
        />
      ),
      okText: 'Xác nhận',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => onSubmit(reason),
    })
  }

  const openConfirmModal = (title: string, onSubmit: () => void) => {
    Modal.confirm({
      title,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: onSubmit,
    })
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
          record.paymentType ?? record.paymentMethod,
        )
        const orderId = (record.id ?? record.buyOrder)!
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Xem chi tiết',
          },
          ...availableActions.map((action) => {
            switch (action) {
              case 'confirm':
                return { key: action, icon: <CheckCircleOutlined />, label: 'Xác nhận đơn' }
              case 'reject':
                return { key: action, icon: <CloseCircleOutlined />, danger: true, label: 'Từ chối đơn' }
              case 'handover':
                return { key: action, icon: <SyncOutlined />, label: 'Bàn giao vận chuyển' }
              case 'complete':
                return { key: action, icon: <SyncOutlined />, label: 'Hoàn tất giao hàng' }
              case 'deliveryFailed':
                return { key: action, icon: <CloseCircleOutlined />, danger: true, label: 'Đánh dấu giao thất bại' }
              case 'deliveryCancelled':
                return { key: action, icon: <CloseCircleOutlined />, danger: true, label: 'Thu hồi vận chuyển' }
              case 'markReturned':
                return { key: action, icon: <SyncOutlined />, label: 'Đánh dấu hoàn hàng' }
              default:
                return null
            }
          }).filter(Boolean),
        ]

        const onMenuClick: MenuProps['onClick'] = ({ key }) => {
          if (key === 'view') {
            router.push(`/orders/${orderId}`)
            return
          }
          const action = key as OrderStatusAction
          if (action === 'reject') {
            openReasonModal('Từ chối đơn hàng', 'Lý do từ chối...', (reason) => {
              handleStatusAction(orderId, 'reject', reason)
            })
            return
          }
          if (action === 'deliveryCancelled') {
            openReasonModal('Thu hồi vận chuyển', 'Lý do thu hồi...', (reason) => {
              handleStatusAction(orderId, 'deliveryCancelled', reason)
            })
            return
          }
          if (action === 'markReturned') {
            openReasonModal('Đánh dấu hoàn hàng', 'Lý do hoàn hàng (tuỳ chọn)...', (reason) => {
              handleStatusAction(orderId, 'markReturned', reason)
            })
            return
          }
          const actionLabels: Record<OrderStatusAction, string> = {
            confirm: 'xác nhận đơn',
            reject: 'từ chối đơn',
            handover: 'bàn giao vận chuyển',
            complete: 'hoàn tất giao hàng',
            deliveryFailed: 'đánh dấu giao thất bại',
            deliveryCancelled: 'thu hồi vận chuyển',
            markReturned: 'đánh dấu hoàn hàng',
          }
          openConfirmModal(`Xác nhận ${actionLabels[action]}?`, () => {
            handleStatusAction(orderId, action)
          })
        }

        return (
          <Dropdown menu={{ items: menuItems, onClick: onMenuClick }} trigger={['click']}>
            <Button size="small">
              Thao tác <DownOutlined />
            </Button>
          </Dropdown>
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
          current: (queryParams.pageIndex ?? 0) + 1,
          pageSize: queryParams.pageSize ?? 20,
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