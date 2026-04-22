'use client'

import React, { useState } from 'react'
import { Button, Card, Col, Input, Row, Space, Statistic, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  getFinanceReconciliationMismatches,
  getFinanceReconciliationSummary,
  resolveFinanceMismatch,
  type FinanceReconciliationMismatchItem,
} from '@/services/rest-api/app-api/finance/finance-service'

const { Title, Text } = Typography

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

export default function FinanceReconciliationPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [page, setPage] = useState(1)
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({})

  const { data: summary, isLoading: summaryLoading, mutate: mutateSummary } = useAxiosSWR(
    [SWR_KEYS.FINANCE_RECONCILIATION_SUMMARY],
    () => getFinanceReconciliationSummary({}),
    { revalidateOnMount: true },
  )

  const { data: mismatches, isLoading: mismatchLoading, mutate: mutateMismatches } = useAxiosSWR(
    [SWR_KEYS.FINANCE_RECONCILIATION_MISMATCHES, page],
    () => getFinanceReconciliationMismatches({ page, size: 20 }),
    { revalidateOnMount: true },
  )

  const columns: ColumnsType<FinanceReconciliationMismatchItem> = [
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 90,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Loại mismatch',
      dataIndex: 'type',
      key: 'type',
      width: 210,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (value: string) => <Tag color={value === 'CRITICAL' ? 'red' : 'orange'}>{value}</Tag>,
    },
    {
      title: 'Resolved',
      key: 'resolved',
      width: 120,
      render: (_, record) => (
        record.resolved ? <Tag color="green">RESOLVED</Tag> : <Tag color="red">OPEN</Tag>
      ),
    },
    {
      title: 'Resolve note',
      key: 'resolveNote',
      width: 220,
      render: (_, record) => (
        <Input
          size="small"
          value={resolveNote[record.mismatchKey] ?? record.resolutionNote}
          disabled={record.resolved}
          onChange={(e) =>
            setResolveNote((prev) => ({
              ...prev,
              [record.mismatchKey]: e.target.value,
            }))
          }
          placeholder="Ghi chú xử lý kế toán"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Button
          size="small"
          disabled={record.resolved}
          onClick={async () => {
            try {
              await resolveFinanceMismatch(record.mismatchKey, resolveNote[record.mismatchKey])
              messageApi.success(`Đã mark resolved: ${record.mismatchKey}`)
              mutateMismatches()
              mutateSummary()
            } catch (error) {
              messageApi.error((error as Error).message || 'Không thể resolve mismatch')
            }
          }}
        >
          Mark resolved
        </Button>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Đối soát giao dịch
        </Title>
        <Text type="secondary">Đối chiếu payment callback, trạng thái đơn và sai lệch số tiền theo luồng kế toán.</Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Gross paid" value={formatVnd(summary?.grossPaidAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Refund" value={formatVnd(summary?.refundAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Net" value={formatVnd(summary?.netAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Unresolved mismatch" value={summary?.unresolvedMismatchCount ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Mismatch queue"
        extra={
          <Space>
            <Text type="secondary">
              Last refresh: {dayjs().format('HH:mm:ss')}
            </Text>
            <Button onClick={() => { mutateSummary(); mutateMismatches() }}>Refresh</Button>
          </Space>
        }
      >
        <AppTable
          rowKey="mismatchKey"
          loading={mismatchLoading}
          columns={columns}
          dataSource={mismatches?.items ?? []}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: mismatches?.pageSize ?? 20,
            total: mismatches?.totalCount ?? 0,
            onChange: (next) => setPage(next),
          }}
        />
      </Card>
    </>
  )
}
