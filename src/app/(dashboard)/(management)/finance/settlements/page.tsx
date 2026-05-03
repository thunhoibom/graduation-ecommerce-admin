'use client'

import React, { useMemo, useState } from 'react'
import { Button, Card, Col, DatePicker, Row, Space, Statistic, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  exportFinanceSettlementCsv,
  getFinanceCallbackLogs,
  getFinanceReconciliationSummary,
  type FinanceCallbackLogItem,
} from '@/services/rest-api/app-api/finance/finance-service'

const { Title, Text } = Typography

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

export default function FinanceSettlementsPage() {
  const [page, setPage] = useState(1)
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().subtract(30, 'day'), dayjs()])

  const params = useMemo(
    () => ({
      from: range[0]?.format('YYYY-MM-DD'),
      to: range[1]?.format('YYYY-MM-DD'),
    }),
    [range],
  )

  const { data: summary, isLoading: summaryLoading, mutate: mutateSummary } = useAxiosSWR(
    [SWR_KEYS.FINANCE_RECONCILIATION_SUMMARY, params],
    () => getFinanceReconciliationSummary(params),
    { revalidateOnMount: true },
  )

  const { data: logs, isLoading: logsLoading, mutate: mutateLogs } = useAxiosSWR(
    [SWR_KEYS.FINANCE_CALLBACK_LOG_LIST, page, params.from, params.to],
    () => getFinanceCallbackLogs({ page, size: 20, from: params.from, to: params.to }),
    { revalidateOnMount: true },
  )

  const columns: ColumnsType<FinanceCallbackLogItem> = [
    {
      title: 'Callback ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      render: (value: number) => <Text code>#{value}</Text>,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (value: string) => (
        <Tag color={value === 'SUCCESS' ? 'green' : value === 'ABORTED' ? 'orange' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: 'Order status after',
      dataIndex: 'orderStatusAfter',
      key: 'orderStatusAfter',
      width: 200,
    },
    {
      title: 'Authorized amount',
      dataIndex: 'authorizedAmount',
      key: 'authorizedAmount',
      width: 160,
      align: 'right',
      render: (value?: number) => (value ? formatVnd(value) : '-'),
    },
    {
      title: 'Processed at',
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
          Chốt số kỳ kế toán
        </Title>
        <Text type="secondary">Theo dõi số tổng hợp kỳ và log callback để đối soát settlement.</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12}>
            <Space>
              <Text>Kỳ đối soát</Text>
              <DatePicker.RangePicker
                value={range}
                onChange={(values) => setRange([values?.[0] ?? null, values?.[1] ?? null])}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space>
              <Button type="primary" onClick={() => { mutateSummary(); mutateLogs() }}>
                Tải số liệu kỳ
              </Button>
              <Button
                onClick={async () => {
                  const blob = await exportFinanceSettlementCsv(params)
                  const url = URL.createObjectURL(blob)
                  const anchor = document.createElement('a')
                  const fromLabel = params.from ?? 'all'
                  const toLabel = params.to ?? 'now'
                  anchor.href = url
                  anchor.download = `finance-settlement-${fromLabel}-to-${toLabel}.csv`
                  anchor.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card loading={summaryLoading}>
            <Statistic title="Gross paid" value={formatVnd(summary?.grossPaidAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={summaryLoading}>
            <Statistic title="Refund" value={formatVnd(summary?.refundAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={summaryLoading}>
            <Statistic title="Net settlement" value={formatVnd(summary?.netAmount)} />
          </Card>
        </Col>
      </Row>

      <Card title="Payment callback logs">
        <AppTable
          rowKey="id"
          loading={logsLoading}
          columns={columns}
          dataSource={logs?.items ?? []}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize: logs?.pageSize ?? 20,
            total: logs?.totalCount ?? 0,
            onChange: (next) => setPage(next),
          }}
        />
      </Card>
    </>
  )
}
