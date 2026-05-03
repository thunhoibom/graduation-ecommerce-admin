'use client'

import React, { useState } from 'react'
import { Button, Card, Col, DatePicker, Input, Row, Space, Statistic, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeFulfillmentStatus,
  normalizePaymentStatus,
} from '@/constants/order-status'
import {
  getFinanceReconciliationMismatches,
  getFinanceReconciliationSummary,
  resolveFinanceMismatch,
  type FinanceReconciliationMismatchItem,
} from '@/services/rest-api/app-api/finance/finance-service'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
type ReconciliationRange = Parameters<NonNullable<RangePickerProps['onChange']>>[0]

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)

const MISMATCH_TYPE_LABELS: Record<string, string> = {
  AMOUNT_MISMATCH: 'Sai lệch số tiền',
  STATUS_MISMATCH: 'Sai lệch trạng thái',
  REFUND_OVERFLOW: 'Hoàn tiền vượt mức',
  REFUND_PERMANENT_FAILURE: 'Hoàn tiền thất bại vĩnh viễn',
}

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Nghiêm trọng', color: 'red' },
  HIGH: { label: 'Cao', color: 'orange' },
}

export default function FinanceReconciliationPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<ReconciliationRange>(null)
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({})
  const from = dateRange?.[0]?.format('YYYY-MM-DD')
  const to = dateRange?.[1]?.format('YYYY-MM-DD')

  const { data: summary, isLoading: summaryLoading, mutate: mutateSummary } = useAxiosSWR(
    [SWR_KEYS.FINANCE_RECONCILIATION_SUMMARY, from, to],
    () => getFinanceReconciliationSummary({ from, to }),
    { revalidateOnMount: true },
  )

  const { data: mismatches, isLoading: mismatchLoading, mutate: mutateMismatches } = useAxiosSWR(
    [SWR_KEYS.FINANCE_RECONCILIATION_MISMATCHES, page, from, to],
    () => getFinanceReconciliationMismatches({ page, size: 20, from, to }),
    { revalidateOnMount: true },
  )

  const columns: ColumnsType<FinanceReconciliationMismatchItem> = [
    {
      title: 'Đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 130,
      render: (value: number) => (
        <a href={`/orders/${value}`} target="_blank" rel="noreferrer">
          <Text code>#{value}</Text>
        </a>
      ),
    },
    {
      title: 'Tổng tiền đơn',
      dataIndex: 'orderTotal',
      key: 'orderTotal',
      width: 160,
      align: 'right',
      render: (value?: number) => <Text strong>{formatVnd(value)}</Text>,
    },
    {
      title: 'TT đơn',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 140,
      render: (value?: string) => {
        const key = normalizeFulfillmentStatus(value)
        const config = FULFILLMENT_STATUS_CONFIG[key]
        return <Tag color={config?.color ?? 'default'}>{config?.label ?? value ?? '-'}</Tag>
      },
    },
    {
      title: 'TT thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 160,
      render: (value?: string) => {
        const key = normalizePaymentStatus(value)
        const config = PAYMENT_STATUS_CONFIG[key]
        return <Tag color={config?.color ?? 'default'}>{config?.label ?? value ?? '-'}</Tag>
      },
    },
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionToken',
      key: 'transactionToken',
      width: 180,
      render: (value?: string) => (
        <Text type="secondary" code>
          {value ? `${value.slice(0, 10)}...` : '-'}
        </Text>
      ),
    },
    {
      title: 'Loại mismatch',
      dataIndex: 'type',
      key: 'type',
      width: 210,
      render: (value: string) => <Tag>{MISMATCH_TYPE_LABELS[value] ?? value}</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (value: string) => {
        const mapped = SEVERITY_LABELS[value]
        return <Tag color={mapped?.color ?? 'default'}>{mapped?.label ?? value}</Tag>
      },
    },
    {
      title: 'Trạng thái',
      key: 'resolved',
      width: 120,
      render: (_, record) => (
        record.resolved ? <Tag color="green">ĐÃ XỬ LÝ</Tag> : <Tag color="red">ĐANG MỞ</Tag>
      ),
    },
    {
      title: 'Ghi chú xử lý',
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
              messageApi.success(`Đã đánh dấu xử lý: ${record.mismatchKey}`)
              mutateMismatches()
              mutateSummary()
            } catch (error) {
              messageApi.error((error as Error).message || 'Không thể resolve mismatch')
            }
          }}
        >
          Đánh dấu xử lý
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
        <Text type="secondary">
          Đối chiếu callback cổng thanh toán, trạng thái đơn và hoàn tiền để kiểm soát doanh thu thuần.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Tổng thanh toán thành công" value={formatVnd(summary?.grossPaidAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Tổng hoàn tiền" value={formatVnd(summary?.refundAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Doanh thu thuần đối soát" value={formatVnd(summary?.netAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Sai lệch chưa xử lý" value={summary?.unresolvedMismatchCount ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card loading={summaryLoading}>
            <Statistic title="Giao dịch thanh toán lỗi" value={summary?.failedPaymentCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={18}>
          <Card>
            <Space align="center" wrap>
              <Text strong>Kỳ đối soát:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setPage(1)
                  setDateRange(dates)
                }}
                format="DD/MM/YYYY"
                allowClear
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Danh sách sai lệch cần xử lý"
        extra={
          <Space>
            <Text type="secondary">
              Cập nhật: {dayjs().format('HH:mm:ss')}
            </Text>
            <Button onClick={() => { mutateSummary(); mutateMismatches() }}>Làm mới</Button>
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
