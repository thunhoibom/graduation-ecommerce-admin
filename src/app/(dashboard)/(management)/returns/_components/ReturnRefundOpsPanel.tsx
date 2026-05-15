'use client'

import React, { useState } from 'react'
import { Button, Card, Col, InputNumber, Row, Space, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  getFinanceRefunds,
  type FinanceRefundOperationItem,
} from '@/services/rest-api/app-api/finance/finance-service'

const { Text } = Typography

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

const ReturnRefundOpsPanel: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [orderId, setOrderId] = useState<number | undefined>()
  const [refundPage, setRefundPage] = useState(1)

  const { data: refundsData, isLoading: refundsLoading, mutate: mutateRefunds } = useAxiosSWR(
    [SWR_KEYS.FINANCE_REFUND_LIST, orderId, refundPage],
    () => getFinanceRefunds({ orderId, page: refundPage, size: 10 }),
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
      title: 'Cập nhật cuối',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 170,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
    },
  ]

  return (
    <>
      {contextHolder}

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
              <Button type="primary" onClick={() => { mutateRefunds() }}>
                Lọc
              </Button>
              <Button
                onClick={() => {
                  setOrderId(undefined)
                  setRefundPage(1)
                }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Hoàn tiền chuyển khoản thủ công">
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
    </>
  )
}

export default ReturnRefundOpsPanel
