'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Typography, Button, Input, Select,
  Tag, Space, message, Popconfirm,
} from 'antd'
import {
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, SearchOutlined, DownloadOutlined,
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
import {
  ListFilterCard,
  ListFilterCol,
  ListFilterField,
  ListFilterGrid,
  LIST_FILTER_SEARCH_FLEX,
  LIST_FILTER_SELECT_FLEX,
} from '@/shared/components/list-filter'
import { exportReturnList } from './return-list-export'
import { formatReturnReason } from '@/lib/return-reason'

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

const REFUND_METHOD_LABEL: Record<string, string> = {
  ORIGINAL_PAYMENT: 'Hoàn về thanh toán gốc',
  STORE_CREDIT: 'Tín dụng cửa hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

const QC_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ kiểm tra' },
  PASSED: { color: 'green', label: 'Đạt' },
  FAILED: { color: 'red', label: 'Không đạt' },
}

// ── Helpers ──────────────────────────────────────────────────────

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')

const getReturnItemSummary = (record: ReturnRequestPojo) => {
  const lineCount = record.items?.length ?? 0
  const quantity = record.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0
  return { lineCount, quantity }
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
  const [exporting, setExporting] = useState(false)

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

  const handleExport = useCallback(async () => {
    if (exporting) return

    setExporting(true)
    try {
      const exportedCount = await exportReturnList(queryParams as ReturnSearchParams)
      if (exportedCount === 0) {
        messageApi.warning('Không có yêu cầu nào để xuất')
        return
      }
      messageApi.success(`Đã xuất ${exportedCount} yêu cầu`)
    } catch {
      messageApi.error('Xuất Excel thất bại')
    } finally {
      setExporting(false)
    }
  }, [exporting, messageApi, queryParams])

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
      width: 110,
      fixed: 'left',
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 110,
      render: (id: number) => (id ? <Text code>#{id}</Text> : '—'),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: ReturnRequestPojo) => {
        const name = record.orderRecipientName || record.order?.recipientName || '—'
        const contact = record.orderRecipientPhone || record.order?.recipientPhone || ''
        return (
          <div>
            <Text strong>{name}</Text>
            {contact ? (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{contact}</Text>
              </>
            ) : null}
          </div>
        )
      },
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      width: 180,
      ellipsis: true,
      render: (r: string) => formatReturnReason(r),
    },
    {
      title: 'Hàng trả',
      key: 'returnItems',
      width: 120,
      align: 'center',
      render: (_: unknown, record: ReturnRequestPojo) => {
        const { lineCount, quantity } = getReturnItemSummary(record)
        return (
          <div>
            <Text strong>{lineCount}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}> mặt</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{quantity} sản phẩm</Text>
          </div>
        )
      },
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
      title: 'Phương thức hoàn',
      dataIndex: 'refundMethod',
      key: 'refundMethod',
      width: 170,
      ellipsis: true,
      render: (value?: string) => REFUND_METHOD_LABEL[value ?? ''] ?? value ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'QC kho',
      dataIndex: 'qcStatus',
      key: 'qcStatus',
      width: 130,
      render: (value?: string) => {
        if (!value) return '—'
        const cfg = QC_STATUS_CONFIG[value] ?? { color: 'default', label: value }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Mã vận đơn trả',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 150,
      ellipsis: true,
      render: (value?: string) => (value ? <Text copyable style={{ fontFamily: 'monospace' }}>{value}</Text> : '—'),
    },
    {
      title: 'Cập nhật cuối',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 140,
      render: (value?: string) => formatDate(value),
    },
    {
      title: 'Hoàn tiền lúc',
      dataIndex: 'refundedAt',
      key: 'refundedAt',
      width: 140,
      render: (value?: string) => formatDate(value),
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

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Yêu cầu trả hàng / Hoàn tiền</Title>
          <Text type="secondary">Xem và xử lý các yêu cầu trả hàng / hoàn tiền.</Text>
        </div>
        <Button
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Xuất Excel
        </Button>
      </div>

      <ListFilterCard>
        <ListFilterGrid>
          <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
            <ListFilterField label="Mã yêu cầu / đơn hàng">
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
            </ListFilterField>
          </ListFilterCol>
          <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
            <ListFilterField label="Trạng thái">
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
                onChange={(v) => handleFilter('status', v)}
              />
            </ListFilterField>
          </ListFilterCol>
        </ListFilterGrid>
      </ListFilterCard>

      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 1900 }}
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
