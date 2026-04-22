'use client'

import React, { useState } from 'react'
import { Button, Card, Col, InputNumber, Row, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { getFinancePayments, type FinancePaymentItem } from '@/services/rest-api/app-api/finance/finance-service'

const { Title, Text } = Typography

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

export default function FinanceFailedPaymentsPage() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [orderId, setOrderId] = useState<number | undefined>()
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>('FAILED')

  const { data, isLoading, mutate } = useAxiosSWR(
    [SWR_KEYS.FINANCE_PAYMENT_LIST, page, size, orderId, paymentStatus],
    () =>
      getFinancePayments({
        page,
        size,
        orderId,
        paymentStatus,
      }),
    { revalidateOnMount: true },
  )

  const columns: ColumnsType<FinancePaymentItem> = [
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 90,
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      width: 130,
      render: (value?: string) => value ?? '-',
    },
    {
      title: 'Payment status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 130,
      render: (value?: string) => (
        <Tag color={value === 'FAILED' ? 'red' : value === 'CANCELLED' ? 'orange' : 'default'}>
          {value ?? 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Order status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 160,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'orderTotal',
      key: 'orderTotal',
      width: 130,
      align: 'right',
      render: (value: number) => <Text strong>{formatVnd(value)}</Text>,
    },
    {
      title: 'Callback',
      dataIndex: 'callbackResult',
      key: 'callbackResult',
      width: 120,
      render: (value?: string) => value ?? '-',
    },
    {
      title: 'Thời gian',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 170,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Đơn lỗi thanh toán
        </Title>
        <Text type="secondary">Theo dõi các đơn có trạng thái thanh toán lỗi/hủy để kế toán xử lý.</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Lọc theo Order ID"
              value={orderId}
              onChange={(v) => setOrderId(v ? Number(v) : undefined)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              allowClear
              value={paymentStatus}
              placeholder="Payment status"
              onChange={setPaymentStatus}
              options={[
                { label: 'FAILED', value: 'FAILED' },
                { label: 'CANCELLED', value: 'CANCELLED' },
                { label: 'PENDING', value: 'PENDING' },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Button type="primary" onClick={() => mutate()}>
                Lọc
              </Button>
              <Button
                onClick={() => {
                  setOrderId(undefined)
                  setPaymentStatus('FAILED')
                  setPage(1)
                }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <AppTable
        rowKey="orderId"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        scroll={{ x: 980 }}
        pagination={{
          current: page,
          pageSize: size,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setSize(nextSize)
          },
        }}
      />
    </>
  )
}
