'use client'

import React from 'react'
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd'
import { EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'
import type { OrderPojo } from '@/services/rest-api/app-api/orders/order-service'
import { paths } from '@/routes/paths'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeFulfillmentStatus,
} from '@/constants/order-status'
import { resolveOrderPaymentStatus, getOrderNetAmount } from '@/lib/order-refund'
import { DASHBOARD_CARD_STYLE, formatVND } from './dashboard-utils'

const { Text } = Typography

type DashboardRecentOrdersProps = {
  orders: OrderPojo[]
  loading?: boolean
}

const getCustomerName = (record: OrderPojo) => {
  if (record.customerName) return record.customerName
  if (record.recipientName) return record.recipientName
  if (record.customer) {
    return `${record.customer.firstName ?? ''} ${record.customer.lastName ?? ''}`.trim()
  }
  return '—'
}

const getCustomerContact = (record: OrderPojo) =>
  record.recipientPhone
  || record.customer?.phone1
  || record.customerEmail
  || record.customer?.email
  || ''

const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = ({ orders, loading }) => {
  const columns: ColumnsType<OrderPojo> = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number | undefined, record) => (
        <Link href={paths.orders.detail(String(record.id ?? record.buyOrder))}>
          <Text strong>#{id ?? record.buyOrder}</Text>
        </Link>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      ellipsis: true,
      render: (_, record) => {
        const contact = getCustomerContact(record)
        return (
          <div>
            <Text strong>{getCustomerName(record)}</Text>
            {contact && (
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                {contact}
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (value: string | undefined) =>
        value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Giá trị thuần',
      key: 'total',
      align: 'right',
      width: 130,
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(getOrderNetAmount(record))}
        </Text>
      ),
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 150,
      render: (_, record) => {
        const paymentKey = resolveOrderPaymentStatus(record)
        const paymentConfig = PAYMENT_STATUS_CONFIG[paymentKey]
        return (
          <Tag color={paymentConfig?.color ?? 'default'}>
            {paymentConfig?.label ?? '—'}
          </Tag>
        )
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const fulfillmentKey = normalizeFulfillmentStatus(record.fulfillmentStatus || record.status)
        const fulfillmentConfig = FULFILLMENT_STATUS_CONFIG[fulfillmentKey]
        return (
          <Tag color={fulfillmentConfig?.color ?? 'default'}>
            {fulfillmentConfig?.label ?? record.fulfillmentStatus ?? record.status ?? '—'}
          </Tag>
        )
      },
    },
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 140,
      render: (value: string | undefined) =>
        value ? <Text copyable>{value}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Link href={paths.orders.detail(String(record.id ?? record.buyOrder))}>
          <Button type="text" icon={<EyeOutlined />} aria-label="Xem chi tiết đơn hàng" />
        </Link>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <ShoppingCartOutlined style={{ color: '#5856d6' }} />
          <span>Đơn hàng gần đây</span>
        </Space>
      }
      extra={
        <Link href={paths.orders.list}>
          <Button type="link" size="small">
            Xem tất cả
          </Button>
        </Link>
      }
      variant="borderless"
      style={DASHBOARD_CARD_STYLE}
    >
      {orders.length === 0 && !loading ? (
        <Empty description="Chưa có đơn hàng trong kỳ đã chọn" />
      ) : (
        <Table
          dataSource={orders}
          rowKey={(record) => String(record.id ?? record.buyOrder)}
          columns={columns}
          pagination={false}
          size="small"
          loading={loading}
          scroll={{ x: 1040 }}
        />
      )}
    </Card>
  )
}

export default DashboardRecentOrders
