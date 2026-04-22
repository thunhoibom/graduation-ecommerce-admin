'use client'

import React, { useState } from 'react'
import { Button, Card, Col, InputNumber, Row, Space, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  getFinanceRefundRetries,
  getFinanceRefunds,
  triggerManualRefundRetry,
  type FinanceRefundOperationItem,
  type FinanceRefundRetryItem,
} from '@/services/rest-api/app-api/finance/finance-service'

const { Title, Text } = Typography

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

export default function FinanceRefundsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [orderId, setOrderId] = useState<number | undefined>()
  const [refundPage, setRefundPage] = useState(1)
  const [retryPage, setRetryPage] = useState(1)

  const { data: refundsData, isLoading: refundsLoading, mutate: mutateRefunds } = useAxiosSWR(
    [SWR_KEYS.FINANCE_REFUND_LIST, orderId, refundPage],
    () => getFinanceRefunds({ orderId, page: refundPage, size: 10 }),
    { revalidateOnMount: true },
  )

  const { data: retryData, isLoading: retryLoading, mutate: mutateRetry } = useAxiosSWR(
    [SWR_KEYS.FINANCE_REFUND_RETRY_LIST, orderId, retryPage],
    () => getFinanceRefundRetries({ orderId, page: retryPage, size: 10 }),
    { revalidateOnMount: true },
  )

  const refundColumns: ColumnsType<FinanceRefundOperationItem> = [
    {
      title: 'Return',
      dataIndex: 'returnRequestId',
      key: 'returnRequestId',
      width: 90,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 90,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Refund',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 130,
      align: 'right',
      render: (value?: number) => formatVnd(value),
    },
    {
      title: 'Đã hoàn lũy kế',
      dataIndex: 'refundedAmountToDate',
      key: 'refundedAmountToDate',
      width: 140,
      align: 'right',
      render: (value: number) => <Text strong>{formatVnd(value)}</Text>,
    },
    {
      title: 'Cập nhật cuối',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 170,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
    },
  ]

  const retryColumns: ColumnsType<FinanceRefundRetryItem> = [
    {
      title: 'Queue',
      dataIndex: 'queueId',
      key: 'queueId',
      width: 90,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 90,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value: string) => (
        <Tag color={value === 'FAILED_PERMANENT' ? 'red' : value === 'PENDING' ? 'orange' : 'green'}>{value}</Tag>
      ),
    },
    {
      title: 'Số lần thử',
      key: 'attempts',
      width: 120,
      render: (_, record) => `${record.failedAttempts}/${record.attemptCount}`,
    },
    {
      title: 'Lỗi cuối',
      dataIndex: 'lastError',
      key: 'lastError',
      ellipsis: true,
      render: (value?: string) => value ?? '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Button
          size="small"
          onClick={async () => {
            try {
              await triggerManualRefundRetry(record.queueId)
              messageApi.success(`Đã trigger manual retry cho queue #${record.queueId}`)
              mutateRetry()
              mutateRefunds()
            } catch (error) {
              messageApi.error((error as Error).message || 'Không thể trigger manual retry')
            }
          }}
        >
          Manual retry
        </Button>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Hoàn tiền & Retry queue
        </Title>
        <Text type="secondary">Theo dõi nghiệp vụ hoàn tiền và xử lý queue thất bại theo luồng kế toán.</Text>
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
          <Col xs={24} md={16}>
            <Space>
              <Button type="primary" onClick={() => { mutateRefunds(); mutateRetry() }}>
                Lọc
              </Button>
              <Button
                onClick={() => {
                  setOrderId(undefined)
                  setRefundPage(1)
                  setRetryPage(1)
                }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Refund operations" style={{ marginBottom: 16 }}>
        <AppTable
          rowKey="returnRequestId"
          loading={refundsLoading}
          columns={refundColumns}
          dataSource={refundsData?.items ?? []}
          scroll={{ x: 900 }}
          pagination={{
            current: refundPage,
            pageSize: refundsData?.pageSize ?? 10,
            total: refundsData?.totalCount ?? 0,
            onChange: (next) => setRefundPage(next),
          }}
        />
      </Card>

      <Card title="Refund retry queue">
        <AppTable
          rowKey="queueId"
          loading={retryLoading}
          columns={retryColumns}
          dataSource={retryData?.items ?? []}
          scroll={{ x: 900 }}
          pagination={{
            current: retryPage,
            pageSize: retryData?.pageSize ?? 10,
            total: retryData?.totalCount ?? 0,
            onChange: (next) => setRetryPage(next),
          }}
        />
      </Card>
    </>
  )
}
