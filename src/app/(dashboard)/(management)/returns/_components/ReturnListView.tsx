'use client'

import React, { useState, useCallback } from 'react'
import {
  Table, Card, Typography, Row, Col, Button, Input, Select,
  Tag, Modal, Descriptions, Divider, Space, message, Popconfirm,
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
  getReturnById,
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
  PENDING:      { color: 'orange', label: 'Chờ duyệt' },
  APPROVED:     { color: 'blue',   label: 'Đã duyệt' },
  REJECTED:     { color: 'red',    label: 'Từ chối' },
  RECEIVED:     { color: 'cyan',   label: 'Đã nhận hàng' },
  COMPLETED:    { color: 'green',  label: 'Hoàn tiền xong' },
  CANCELLED:    { color: 'default',label: 'Đã hủy' },
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
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<ReturnSearchParams>>({
    page: 1,
    size: 20,
  })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: ReturnRequestPojo[]
    totalElements: number
  }>(
    [SWR_KEYS.RETURN_LIST, queryParams],
    async () => {
      const res = await searchReturns(queryParams as ReturnSearchParams)
      return {
        data: res.data ?? [],
        totalElements: res.totalElements ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, page, size }))
  }, [])

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const handleView = useCallback((record: ReturnRequestPojo) => {
    setSelectedId(record.id!)
    setDetailOpen(true)
  }, [])

  const { data: returnDetail } = useAxiosSWR<ReturnRequestPojo>(
    detailOpen && selectedId ? [SWR_KEYS.RETURN_LIST, selectedId] : null,
    detailOpen && selectedId ? async () => getReturnById(selectedId) : null,
    { revalidateOnMount: true },
  )

  const handleAction = async (
    action: 'approve' | 'reject' | 'receive' | 'complete' | 'cancel',
    id: number,
    reason?: string,
  ) => {
    try {
      switch (action) {
        case 'approve': await approveReturn(id); break
        case 'reject': await rejectReturn(id, reason); break
        case 'receive': await receiveReturn(id); break
        case 'complete': await completeRefund(id); break
        case 'cancel': await cancelReturn(id, reason); break
      }
      messageApi.success('Cập nhật thành công')
      setDetailOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  const selectedStatus = returnDetail?.status ?? 'PENDING'

  const statusActions: Record<string, React.ReactNode> = {
    PENDING: (
      <Space>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleAction('approve', selectedId!)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Duyệt
        </Button>
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
          onConfirm={() => handleAction('reject', selectedId!, rejectReason)}
        >
          <Button danger icon={<CloseCircleOutlined />}>
            Từ chối
          </Button>
        </Popconfirm>
      </Space>
    ),
    APPROVED: (
      <Button
        type="primary"
        icon={<SyncOutlined />}
        onClick={() => handleAction('receive', selectedId!)}
      >
        Đã nhận hàng trả
      </Button>
    ),
    RECEIVED: (
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        onClick={() => handleAction('complete', selectedId!)}
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
      >
        Hoàn tiền
      </Button>
    ),
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
        <Tag>{record.items?.length ?? 0}</Tag>
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
      width: 130,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ReturnRequestPojo) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
      ),
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
                page: 1,
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
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} yêu cầu`,
          onChange: handleTableChange,
        }}
      />

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết yêu cầu trả hàng #${selectedId}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={640}
        footer={
          statusActions[selectedStatus] ? (
            <Space>{statusActions[selectedStatus]}</Space>
          ) : (
            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
          )
        }
      >
        {returnDetail && (
          <>
            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag
                  color={STATUS_CONFIG[returnDetail.status ?? 'PENDING']?.color}
                  style={{ fontSize: 13, padding: '2px 10px' }}
                >
                  {STATUS_CONFIG[returnDetail.status ?? 'PENDING']?.label}
                </Tag>
                <Text type="secondary">
                  Ngày: {returnDetail.date ? dayjs(returnDetail.date).format('DD/MM/YYYY HH:mm') : '—'}
                </Text>
              </Space>
            </div>

            <Descriptions column={2} bordered size="small" title="Thông tin chung">
              <Descriptions.Item label="Mã đơn hàng">
                {returnDetail.orderId ? <Text code>#{returnDetail.orderId}</Text> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức hoàn">
                {returnDetail.refundMethod ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền hoàn">
                <Text strong style={{ color: '#52c41a' }}>
                  {formatVND(returnDetail.refundAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã vận đơn">
                {returnDetail.trackingNumber ?? '—'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="Lý do">{returnDetail.reason ?? '—'}</Descriptions.Item>
              {returnDetail.adminNotes && (
                <Descriptions.Item label="Ghi chú admin">
                  {returnDetail.adminNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Items */}
            <Divider orientation="left">Sản phẩm trả</Divider>
            <Table
              dataSource={returnDetail.items ?? []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Sản phẩm', dataIndex: 'id', render: (id: number) => `Sản phẩm #${id}` },
                { title: 'Số lượng', dataIndex: 'quantity', align: 'center' as const },
                {
                  title: 'Giá trị',
                  dataIndex: 'returnPrice',
                  align: 'right' as const,
                  render: (v: number) => formatVND(v),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  )
}

export default ReturnListView
