'use client'

import React from 'react'
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd'
import { DollarOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'
import type { FinancePaymentItem } from '@/services/rest-api/app-api/finance/finance-service'
import { paths } from '@/routes/paths'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeFulfillmentStatus,
} from '@/constants/order-status'
import {
  getOrderNetAmount,
  resolveOrderPaymentStatus,
} from '@/lib/order-refund'
import { DASHBOARD_CARD_STYLE, formatVND } from './dashboard-utils'

const { Text } = Typography

type DashboardPaymentTransactionsProps = {
  transactions: FinancePaymentItem[]
  loading?: boolean
}

const renderPaymentStatus = (record: FinancePaymentItem) => {
  const paymentKey = resolveOrderPaymentStatus({
    paymentStatus: record.paymentStatus,
    totalRefundedAmount: record.totalRefundedAmount,
    totalValue: record.orderTotal,
  })
  const paymentConfig = PAYMENT_STATUS_CONFIG[paymentKey]
  return <Tag color={paymentConfig?.color ?? 'default'}>{paymentConfig?.label ?? '—'}</Tag>
}

const DashboardPaymentTransactions: React.FC<DashboardPaymentTransactionsProps> = ({
  transactions,
  loading,
}) => {
  const columns: ColumnsType<FinancePaymentItem> = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      render: (value: number) => (
        <Link href={paths.orders.detail(String(value))}>
          <Text strong>#{value}</Text>
        </Link>
      ),
    },
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionToken',
      key: 'transactionToken',
      ellipsis: true,
      render: (value: string | undefined) => value || '—',
    },
    {
      title: 'Cổng thanh toán',
      dataIndex: 'gateway',
      key: 'gateway',
      width: 120,
      render: (value: string | undefined) => value || '—',
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 140,
      render: (_, record) => renderPaymentStatus(record),
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 140,
      render: (value: string | undefined) => {
        const key = normalizeFulfillmentStatus(value)
        const config = FULFILLMENT_STATUS_CONFIG[key]
        return <Tag color={config?.color ?? 'default'}>{config?.label ?? value ?? '—'}</Tag>
      },
    },
    {
      title: 'Giá trị thuần',
      dataIndex: 'orderTotal',
      key: 'orderTotal',
      align: 'right',
      width: 130,
      render: (_value: number | undefined, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(getOrderNetAmount({
            totalValue: record.orderTotal,
            totalRefundedAmount: record.totalRefundedAmount,
          }))}
        </Text>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 150,
      render: (value: string | undefined) =>
        value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'center',
      render: (_, record) => (
        <Link href={paths.orders.detail(String(record.orderId))}>
          <Button type="text" icon={<EyeOutlined />} aria-label="Xem chi tiết đơn hàng" />
        </Link>
      ),
    },
  ]

  return (
    <Card
      id="payment-transactions"
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Giao dịch thanh toán</span>
        </Space>
      }
      variant="borderless"
      style={DASHBOARD_CARD_STYLE}
    >
      {transactions.length === 0 && !loading ? (
        <Empty description="Chưa có giao dịch trong kỳ đã chọn" />
      ) : (
        <Table
          dataSource={transactions}
          rowKey={(record) => `${record.orderId}-${record.transactionToken ?? record.processedAt ?? 'unknown'}`}
          columns={columns}
          pagination={false}
          size="small"
          loading={loading}
          scroll={{ x: 980 }}
        />
      )}
    </Card>
  )
}

export default DashboardPaymentTransactions
