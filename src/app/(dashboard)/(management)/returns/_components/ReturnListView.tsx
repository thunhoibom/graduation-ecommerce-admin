'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, Card, Typography, Row, Col, Button, Input, Select,
  Tag, Space, message, Popconfirm,
} from 'antd'
import {
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, UndoOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchReturns,
  approveReturn,
  rejectReturn,
  receiveReturn,
  completeRefund,
  cancelReturn,
  type ReturnRequestPojo,
  type ReturnSearchParams,
} from '@/services/rest-api/app-api/returns/return-service'
import AppTable from '@/shared/components/antd/AppTable'

const { Title, Text } = Typography

// ── Status Config ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:           { color: 'orange',     label: 'Chờ duyệt' },
  APPROVED:          { color: 'blue',       label: 'Đã duyệt' },
  REJECTED:          { color: 'red',        label: 'Từ chối' },
  RECEIVED:          { color: 'cyan',       label: 'Đã nhận hàng' },
  REFUND_PROCESSING: { color: 'processing', label: 'Đang hoàn tiền' },
  REFUND_COMPLETED:  { color: 'green',      label: 'Hoàn tiền xong' },
  CANCELLED:         { color: 'default',    label: 'Đã hủy' },
}

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
  label: cfg.label,
  value,
}))

// ── Helpers ──────────────────────────────────────────────────────

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── ReturnListView ───────────────────────────────────────────────

const ReturnListView: React.FC = () => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<ReturnSearchParams>>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading, mutate } = useAxiosSWR<{
    items: ReturnRequestPojo[]
    totalCount: number
  }>(
    [SWR_KEYS.RETURN_LIST, queryParams],
    async () => {
      const res = await searchReturns(queryParams as ReturnSearchParams)
      return {
        items: res.items ?? [],
        totalCount: res.totalCount ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, pageIndex: page - 1, pageSize: size }))
  }, [])

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, [key]: value, pageIndex: 0 }))
  }, [])

  const handleAction = async (
    action: 'approve' | 'reject' | 'receive' | 'complete' | 'cancel',
    id: number,
    reason?: string,
  ) => {
    try {
      switch (action) {
        case 'approve':  await approveReturn(id); break
        case 'reject':   await rejectReturn(id, reason); break
        case 'receive':  await receiveReturn(id); break
        case 'complete': await completeRefund(id); break
        case 'cancel':   await cancelReturn(id, reason); break
      }
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  const columns: ColumnsType<ReturnRequestPojo> = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120,
      render: (id: number) => id ? <Text code>#{id}</Text> : '—',
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (r: string) => r || '—',
    },
    {
      title: 'Số sản phẩm',
      key: 'itemCount',
      width: 110,
      align: 'center',
      render: (_: unknown, record: ReturnRequestPojo) => (
        <Tag>{record.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0}</Tag>
      ),
    },
    {
      title: 'Hoàn tiền',
      key: 'refund',
      width: 130,
      align: 'right',
      render: (_: unknown, record: ReturnRequestPojo) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(record.refundAmount)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: ReturnRequestPojo) => {
        const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status }
        return (
          <Space size={4} wrap>
            <Tag color={cfg.color}>{cfg.label}</Tag>
            {status === 'RECEIVED' && record.qcStatus === 'PENDING' && (
              <Tag color="gold">Chờ QC</Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: ReturnRequestPojo) => {
        const status = record.status ?? 'PENDING'
        return (
          <Space size={4}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/returns/${record.id}`)}
              title="Xem chi tiết"
            />
            {/* Inline status actions */}
            {status === 'PENDING' && (
              <>
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleAction('approve', record.id!)}
                  title="Duyệt"
                />
                <Popconfirm
                  title="Từ chối yêu cầu?"
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
                    handleAction('reject', record.id!, rejectReason)
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
            {status === 'APPROVED' && (
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => handleAction('receive', record.id!)}
                title="Đã nhận hàng trả"
              />
            )}
            {status === 'RECEIVED' && (
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => router.push(`/returns/${record.id}`)}
                title={record.qcStatus === 'PASSED' ? 'Xử lý hoàn tiền' : 'Kiểm tra hàng (QC)'}
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
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Yêu cầu trả hàng / Hoàn tiền</Title>
        <Text type="secondary">Xem và xử lý các yêu cầu đổi/trả hàng</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={16} md={8}>
            <Input.Search
              placeholder="Tìm mã yêu cầu, đơn hàng..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(v) => setQueryParams((prev) => ({
                ...prev,
                orderId: v ? Number(v) : undefined,
                pageIndex: 0,
              }))}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
              onChange={(v) => handleFilter('status', v)}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 1000 }}
        pagination={{
          current: (queryParams.pageIndex ?? 0) + 1,
          pageSize: queryParams.pageSize ?? 20,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} yêu cầu`,
          onChange: handleTableChange,
        }}
      />
    </>
  )
}

export default ReturnListView
