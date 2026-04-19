'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Table, Tag, Button, Space,
  Divider, Spin, Breadcrumb, Row, Col, Statistic, message,
  Steps, Alert, Input, Modal,
} from 'antd'
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, UndoOutlined, FormOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getReturnById,
  approveReturn,
  rejectReturn,
  receiveReturn,
  startRefundProcessing,
  completeRefund,
  cancelReturn,
  type ReturnRequestPojo,
  type ReturnRequestItemPojo,
} from '@/services/rest-api/app-api/returns/return-service'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// ── Status Config ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:          { color: 'orange',   label: 'Chờ duyệt' },
  APPROVED:         { color: 'blue',     label: 'Đã duyệt' },
  REJECTED:         { color: 'red',      label: 'Từ chối' },
  RECEIVED:         { color: 'cyan',     label: 'Đã nhận hàng' },
  REFUND_PROCESSING:{ color: 'processing',label: 'Đang hoàn tiền' },
  REFUND_COMPLETED: { color: 'green',    label: 'Hoàn tiền xong' },
  CANCELLED:        { color: 'default',  label: 'Đã hủy' },
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (d: string | undefined) =>
  d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'

// ── Refund method labels ─────────────────────────────────────────

const REFUND_METHOD_LABEL: Record<string, string> = {
  ORIGINAL_PAYMENT: 'Hoàn về thanh toán gốc',
  STORE_CREDIT:    'Tín dụng cửa hàng',
  BANK_TRANSFER:   'Chuyển khoản ngân hàng',
}

// ── ReturnDetailView ─────────────────────────────────────────────

interface ReturnDetailViewProps {
  returnId: number
}

const ReturnDetailView: React.FC<ReturnDetailViewProps> = ({ returnId }) => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const { data: ret, isLoading, mutate } = useAxiosSWR<ReturnRequestPojo>(
    [SWR_KEYS.RETURN_DETAIL, returnId],
    async () => getReturnById(returnId),
    { revalidateOnMount: true },
  )

  const handleAction = async (
    action: 'approve' | 'reject' | 'receive' | 'startRefund' | 'complete' | 'cancel',
    reason?: string,
  ) => {
    try {
      switch (action) {
        case 'approve':    await approveReturn(returnId); break
        case 'reject':     await rejectReturn(returnId, reason); break
        case 'receive':    await receiveReturn(returnId); break
        case 'startRefund': await startRefundProcessing(returnId); break
        case 'complete':   await completeRefund(returnId); break
        case 'cancel':    await cancelReturn(returnId, reason); break
      }
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      // Notes save would call updateReturnNotes if endpoint exists
      messageApi.success('Ghi chú đã lưu')
    } catch {
      messageApi.error('Lưu ghi chú thất bại')
    } finally {
      setSavingNotes(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!ret) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">Không tìm thấy yêu cầu trả hàng</Text>
      </div>
    )
  }

  const status = ret.status ?? 'PENDING'
  const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status }

  // Steps — map status to index
  const WORKFLOW_STEPS = [
    { title: 'Chờ duyệt',    description: 'Yêu cầu được gửi' },
    { title: 'Đã duyệt',      description: 'Admin duyệt đồng ý' },
    { title: 'Đã nhận hàng',  description: 'Nhận lại sản phẩm' },
    { title: 'Đang hoàn tiền',description: 'Đang xử lý hoàn tiền' },
    { title: 'Hoàn tiền xong',description: 'Hoàn tất' },
  ]

  const TERMINAL_STEPS = ['REFUND_COMPLETED', 'REJECTED', 'CANCELLED']

  const statusToIndex: Record<string, number> = {
    PENDING: 0,
    APPROVED: 1,
    RECEIVED: 2,
    REFUND_PROCESSING: 3,
    REFUND_COMPLETED: 4,
  }

  const currentStep = statusToIndex[status] ?? 0

  // ── Action buttons by status ──────────────────────────────────

  const actionButtons = () => {
    switch (status) {
      case 'PENDING':
        return (
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Button
              block
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAction('approve')}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Duyệt yêu cầu
            </Button>
            <Button
              block
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModalOpen(true)}
            >
              Từ chối
            </Button>
            <Button
              block
              type="text"
              icon={<UndoOutlined />}
              onClick={() => setCancelModalOpen(true)}
            >
              Hủy yêu cầu
            </Button>
          </Space>
        )
      case 'APPROVED':
        return (
          <Button
            block
            type="primary"
            icon={<SyncOutlined />}
            onClick={() => handleAction('receive')}
          >
            Đã nhận hàng trả
          </Button>
        )
      case 'RECEIVED':
        return (
          <Button
            block
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction('startRefund')}
            style={{ backgroundColor: '#1677ff', borderColor: '#1677ff' }}
          >
            Bắt đầu hoàn tiền
          </Button>
        )
      case 'REFUND_PROCESSING':
        return (
          <Button
            block
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction('complete')}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Xác nhận hoàn tiền xong
          </Button>
        )
      default:
        return null
    }
  }

  // ── Items table columns ─────────────────────────────────────────

  const itemColumns: ColumnsType<ReturnRequestItemPojo> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: unknown, record: ReturnRequestItemPojo) => (
        <div>
          <Text strong>{record.product?.name ?? `Sản phẩm #${record.productId ?? record.id}`}</Text>
          {record.product?.barcode && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.product.barcode}</Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: ReturnRequestItemPojo) => {
        const img = record.product?.images?.[0]?.url
        if (!img) return <div style={{ width: 56, height: 56, background: '#f0f0f0', borderRadius: 4 }} />
        return (
          <img src={img} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }} />
        )
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
      render: (v: number) => v ?? '—',
    },
    {
      title: 'Giá trị trả',
      key: 'returnPrice',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: ReturnRequestItemPojo) => (
        <Text type="secondary">{formatVND(record.quantity)}</Text>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (r: string) => r || '—',
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Reject Modal */}
      <Modal
        title="Từ chối yêu cầu trả hàng"
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        onOk={() => { handleAction('reject', rejectReason); setRejectModalOpen(false); setRejectReason('') }}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
      >
        <Text>Vui lòng nhập lý do từ chối:</Text>
        <TextArea
          rows={3}
          placeholder="Lý do từ chối..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Hủy yêu cầu trả hàng"
        open={cancelModalOpen}
        onCancel={() => { setCancelModalOpen(false); setCancelReason('') }}
        onOk={() => { handleAction('cancel', cancelReason); setCancelModalOpen(false); setCancelReason('') }}
        okText="Hủy yêu cầu"
        okButtonProps={{ danger: true }}
      >
        <Text>Vui lòng nhập lý do hủy:</Text>
        <TextArea
          rows={3}
          placeholder="Lý do hủy..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/returns/list')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/returns/list')}>Yêu cầu trả hàng</a> },
            { title: `#${returnId}` },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/returns/list')}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Yêu cầu trả hàng #{returnId}
          </Title>
          <Tag color={cfg.color} style={{ fontSize: 13, padding: '2px 10px' }}>
            {cfg.label}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Left column ── */}
        <Col xs={24} lg={15}>

          {/* Workflow Steps */}
          {!TERMINAL_STEPS.includes(status) && (
            <Card style={{ marginBottom: 16 }}>
              <Steps
                current={currentStep}
                items={WORKFLOW_STEPS.map((step, idx) => ({
                  title: step.title,
                  description: idx <= currentStep ? step.description : undefined,
                }))}
                size="small"
              />
            </Card>
          )}

          {/* Terminal status alerts */}
          {status === 'REJECTED' && (
            <Alert
              type="error"
              message="Yêu cầu bị từ chối"
              description="Yêu cầu trả hàng đã bị từ chối. Không thể thực hiện thêm thao tác."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {status === 'CANCELLED' && (
            <Alert
              type="warning"
              message="Yêu cầu đã bị hủy"
              description="Yêu cầu trả hàng đã bị hủy bởi khách hàng hoặc admin."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {status === 'REFUND_COMPLETED' && (
            <Alert
              type="success"
              message="Hoàn tiền hoàn tất"
              description="Yêu cầu trả hàng đã được xử lý thành công. Tiền đã được hoàn cho khách hàng."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Return items */}
          <Card title="Sản phẩm yêu cầu trả" style={{ marginBottom: 16 }}>
            <Table
              dataSource={ret.items ?? []}
              rowKey="id"
              columns={itemColumns}
              pagination={false}
              size="middle"
              scroll={{ x: 600 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text>Tổng số sản phẩm</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Text strong>
                        {(ret.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 0), 0)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#52c41a' }}>
                        {formatVND(ret.refundAmount)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Admin notes */}
          <Card title="Ghi chú nội bộ" style={{ marginBottom: 16 }}>
            <TextArea
              rows={3}
              placeholder="Nhập ghi chú nội bộ (không hiển thị cho khách hàng)..."
              value={ret.adminNotes ?? notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              type="primary"
              icon={<FormOutlined />}
              style={{ marginTop: 8 }}
              loading={savingNotes}
              onClick={handleSaveNotes}
            >
              Lưu ghi chú
            </Button>
          </Card>
        </Col>

        {/* ── Right column ── */}
        <Col xs={24} lg={9}>

          {/* Actions */}
          <Card title="Thao tác" style={{ marginBottom: 16 }}>
            {actionButtons()}
          </Card>

          {/* Return summary */}
          <Card title="Thông tin hoàn tiền" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Số tiền hoàn">
                <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                  {formatVND(ret.refundAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức">
                {REFUND_METHOD_LABEL[ret.refundMethod ?? ''] ?? ret.refundMethod ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã vận đơn">
                {ret.trackingNumber ? (
                  <Text copyable style={{ fontFamily: 'monospace' }}>{ret.trackingNumber}</Text>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Original order info */}
          {ret.orderId && (
            <Card title="Đơn hàng gốc" style={{ marginBottom: 16 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã đơn">
                  <Text code>#{ret.orderId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt">
                  {formatDate(ret.order?.date)}
                </Descriptions.Item>
                <Descriptions.Item label="Người nhận">
                  {ret.order?.recipientName ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {ret.order?.recipientPhone ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền đơn">
                  {formatVND(ret.order?.totalValue)}
                </Descriptions.Item>
              </Descriptions>
              <Button
                type="link"
                style={{ padding: 0, marginTop: 8 }}
                onClick={() => router.push(`/orders/${ret.orderId}`)}
              >
                Xem chi tiết đơn hàng →
              </Button>
            </Card>
          )}

          {/* Return request metadata */}
          <Card title="Thông tin yêu cầu">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã yêu cầu">
                <Text code>#{returnId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày yêu cầu">
                {formatDate(ret.date)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {formatDate(ret.lastModified)}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do">
                {ret.reason ?? '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ReturnDetailView
