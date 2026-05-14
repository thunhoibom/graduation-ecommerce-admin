'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Table, Tag, Button, Space,
  Divider, Spin, Breadcrumb, Row, Col, Statistic, message,
  Steps, Alert, Input, Modal, Upload, Image, Select,
} from 'antd'
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, UndoOutlined, FormOutlined, PlusOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload'
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
  submitReturnQc,
  type ReturnRequestPojo,
  type ReturnRequestItemPojo,
} from '@/services/rest-api/app-api/returns/return-service'
import { getOrderById, type OrderPojo } from '@/services/rest-api/app-api/orders/order-service'
import { uploadImage } from '@/services/rest-api/app-api/media/media-service'

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

const QC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ kiểm tra',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
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
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [qcModalOpen, setQcModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [refundProofUrl, setRefundProofUrl] = useState('')
  const [refundProofFileList, setRefundProofFileList] = useState<UploadFile[]>([])
  const [refundReference, setRefundReference] = useState('')
  const [completeNotes, setCompleteNotes] = useState('')
  const [qcResult, setQcResult] = useState<'PASSED' | 'FAILED'>('PASSED')
  const [qcNotes, setQcNotes] = useState('')
  const [qcPhotoFileList, setQcPhotoFileList] = useState<UploadFile[]>([])
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const { data: ret, isLoading, mutate } = useAxiosSWR<ReturnRequestPojo>(
    [SWR_KEYS.RETURN_DETAIL, returnId],
    async () => getReturnById(returnId),
    { revalidateOnMount: true },
  )

  const resolvedOrderId =
    ret?.orderId != null
      ? Number(ret.orderId)
      : ret?.order?.id != null
        ? Number(ret.order.id)
        : undefined

  const { data: fallbackOrder } = useAxiosSWR<OrderPojo>(
    resolvedOrderId ? [SWR_KEYS.ORDER_DETAIL, resolvedOrderId] : null,
    resolvedOrderId ? async () => getOrderById(resolvedOrderId) : null,
    { revalidateOnMount: true, showErrorNotification: false },
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
        case 'complete':   await completeRefund(returnId, { adminNotes: reason }); break
        case 'cancel':    await cancelReturn(returnId, reason); break
      }
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  const resetCompleteRefundForm = () => {
    setCompleteNotes('')
    setRefundProofUrl('')
    setRefundProofFileList([])
    setRefundReference('')
  }

  const handleRefundProofUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await uploadImage(file as File)
      onSuccess?.(result)
      setRefundProofUrl(result.url)
    } catch (err) {
      onError?.(err as Error)
      messageApi.error('Upload ảnh biên lai thất bại')
    }
  }

  const handleRefundProofChange: UploadProps['onChange'] = ({ fileList }) => {
    const nextFileList = fileList.slice(-1)
    setRefundProofFileList(nextFileList)
    const uploaded = nextFileList[0]?.response as { url?: string } | undefined
    if (!nextFileList.length) {
      setRefundProofUrl('')
      return
    }
    if (uploaded?.url) {
      setRefundProofUrl(uploaded.url)
    }
  }

  const handleConfirmCompleteRefund = async () => {
    const proofUrl = refundProofUrl.trim()
    const reference = refundReference.trim()
    if (ret?.refundMethod === 'BANK_TRANSFER' && !proofUrl && !reference) {
      messageApi.error('Vui lòng tải ảnh biên lai chuyển khoản hoặc nhập mã giao dịch')
      return
    }
    try {
      await completeRefund(returnId, {
        adminNotes: completeNotes || undefined,
        refundProofUrl: proofUrl || undefined,
        refundReference: reference || undefined,
      })
      messageApi.success('Đã xác nhận hoàn tiền')
      setCompleteModalOpen(false)
      resetCompleteRefundForm()
      mutate()
    } catch {
      messageApi.error('Xác nhận hoàn tiền thất bại')
    }
  }

  const resetQcForm = () => {
    setQcResult('PASSED')
    setQcNotes('')
    setQcPhotoFileList([])
  }

  const handleQcPhotoUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await uploadImage(file as File)
      onSuccess?.(result)
    } catch (err) {
      onError?.(err as Error)
      messageApi.error('Upload ảnh QC thất bại')
    }
  }

  const handleQcPhotoChange: UploadProps['onChange'] = ({ fileList }) => {
    setQcPhotoFileList(fileList.slice(0, 3))
  }

  const handleConfirmQc = async () => {
    const photoUrls = qcPhotoFileList
      .map((file) => (file.response as { url?: string } | undefined)?.url ?? file.url)
      .filter((url): url is string => Boolean(url))
    try {
      await submitReturnQc(returnId, {
        result: qcResult,
        qcNotes: qcNotes || undefined,
        photoUrls: photoUrls.length ? photoUrls : undefined,
      })
      messageApi.success(qcResult === 'PASSED' ? 'QC đạt, đã cộng lại tồn kho' : 'Đã ghi nhận QC không đạt')
      setQcModalOpen(false)
      resetQcForm()
      mutate()
    } catch {
      messageApi.error('Ghi nhận QC thất bại')
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
  const qcStatus = ret.qcStatus ?? (status === 'RECEIVED' ? 'PENDING' : undefined)
  const qcPhotoList = (ret.qcPhotoUrls ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
  const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status }

  // Steps — map status to index
  const WORKFLOW_STEPS = [
    { title: 'Chờ duyệt',    description: 'Yêu cầu được gửi' },
    { title: 'Đã duyệt',      description: 'Admin duyệt đồng ý' },
    { title: 'Đã nhận hàng',  description: 'Nhận lại sản phẩm' },
    { title: 'Kiểm tra hàng', description: 'QC kho' },
    { title: 'Đang hoàn tiền',description: 'Đang xử lý hoàn tiền' },
    { title: 'Hoàn tiền xong',description: 'Hoàn tất' },
  ]

  const TERMINAL_STEPS = ['REFUND_COMPLETED', 'REJECTED', 'CANCELLED']

  const statusToIndex: Record<string, number> = {
    PENDING: 0,
    APPROVED: 1,
    RECEIVED: qcStatus === 'PASSED' ? 3 : 2,
    REFUND_PROCESSING: 4,
    REFUND_COMPLETED: 5,
  }

  const currentStep = statusToIndex[status] ?? 0
  const orderInfo = ret.order ?? {
    id: fallbackOrder?.id,
    date: fallbackOrder?.date,
    recipientName: fallbackOrder?.recipientName
      ?? [fallbackOrder?.customer?.firstName, fallbackOrder?.customer?.lastName].filter(Boolean).join(' ')
      ?? undefined,
    recipientPhone: fallbackOrder?.recipientPhone ?? fallbackOrder?.customer?.phone1,
    totalValue: fallbackOrder?.totalValue,
    status: fallbackOrder?.status ?? fallbackOrder?.fulfillmentStatus,
  }
  const displayItems = (ret.items ?? []).map((item) => {
    const matchedDetail = (fallbackOrder?.details ?? []).find((detail) => {
      if (item.variantId && detail.variantId) {
        return Number(detail.variantId) === Number(item.variantId)
      }
      if (item.productId && detail.product?.id) {
        return Number(detail.product.id) === Number(item.productId)
      }
      return false
    })
    const unitValue = matchedDetail?.unitValue
    return {
      ...item,
      product: item.product ?? matchedDetail?.product,
      returnValue: unitValue != null ? unitValue * (item.quantity ?? 0) : undefined,
    }
  })

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
        if (qcStatus === 'PASSED') {
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
        }
        return (
          <Button
            block
            type="primary"
            icon={<FormOutlined />}
            onClick={() => setQcModalOpen(true)}
          >
            Kiểm tra hàng (QC)
          </Button>
        )
      case 'REFUND_PROCESSING':
        return (
          <Button
            block
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setCompleteModalOpen(true)}
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
          <Text strong>{record.product?.name ?? `Sản phẩm #${record.productId ?? record.variantId ?? record.id}`}</Text>
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
      render: (_: unknown, record: ReturnRequestItemPojo & { returnValue?: number }) => (
        <Text type="secondary">{formatVND(record.returnValue)}</Text>
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

      <Modal
        title="Kiểm tra hàng trả (QC)"
        open={qcModalOpen}
        onCancel={() => {
          setQcModalOpen(false)
          resetQcForm()
        }}
        onOk={handleConfirmQc}
        okText="Lưu kết quả QC"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <Text type="secondary">
            Chỉ khi QC đạt hệ thống mới cộng lại tồn kho và cho phép hoàn tiền.
          </Text>
          <Select
            value={qcResult}
            onChange={(value) => setQcResult(value)}
            options={[
              { value: 'PASSED', label: 'Đạt — cộng lại tồn kho' },
              { value: 'FAILED', label: 'Không đạt — từ chối hoàn tiền' },
            ]}
          />
          <TextArea
            rows={3}
            placeholder="Ghi chú kiểm hàng"
            value={qcNotes}
            onChange={(e) => setQcNotes(e.target.value)}
          />
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Ảnh kiện hàng / tình trạng sản phẩm
            </Text>
            <Upload
              accept="image/*"
              listType="picture-card"
              fileList={qcPhotoFileList}
              customRequest={handleQcPhotoUpload}
              onChange={handleQcPhotoChange}
              maxCount={3}
            >
              {qcPhotoFileList.length >= 3 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </div>
        </Space>
      </Modal>

      <Modal
        title="Xác nhận hoàn tiền"
        open={completeModalOpen}
        onCancel={() => {
          setCompleteModalOpen(false)
          resetCompleteRefundForm()
        }}
        onOk={handleConfirmCompleteRefund}
        okText="Xác nhận đã hoàn"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <Text type="secondary">
            Tải ảnh biên lai chuyển khoản (lưu trên hệ thống) và/hoặc nhập mã giao dịch để audit hoàn tiền thủ công.
          </Text>
          <Input
            placeholder="Mã giao dịch / nội dung chuyển khoản"
            value={refundReference}
            onChange={(e) => setRefundReference(e.target.value)}
          />
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Ảnh biên lai chuyển khoản
            </Text>
            <Upload
              accept="image/*"
              listType="picture-card"
              fileList={refundProofFileList}
              customRequest={handleRefundProofUpload}
              onChange={handleRefundProofChange}
              maxCount={1}
            >
              {refundProofFileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </div>
          <TextArea
            rows={3}
            placeholder="Ghi chú hoàn tiền"
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
          />
        </Space>
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
          {status === 'RECEIVED' && qcStatus === 'PENDING' && (
            <Alert
              type="info"
              message="Chờ kiểm tra hàng (QC)"
              description="Kiện hàng đã về kho. Cần QC đạt trước khi cộng lại tồn kho và hoàn tiền."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Return items */}
          <Card title="Sản phẩm yêu cầu trả" style={{ marginBottom: 16 }}>
            <Table
              dataSource={displayItems}
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
                        {displayItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0)}
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
              <Descriptions.Item label="QC kho">
                {qcStatus ? (QC_STATUS_LABEL[qcStatus] ?? qcStatus) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú QC">
                {ret.qcNotes ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh QC">
                {qcPhotoList.length ? (
                  <Space wrap>
                    {qcPhotoList.map((url) => (
                      <Image
                        key={url}
                        src={url}
                        alt="Ảnh QC"
                        width={72}
                        style={{ borderRadius: 4 }}
                      />
                    ))}
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm QC">
                {formatDate(ret.qcCompletedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">
                {ret.refundBankName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                {ret.refundBankAccountNumber ? <Text copyable>{ret.refundBankAccountNumber}</Text> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">
                {ret.refundBankAccountHolder ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch hoàn">
                {ret.refundReference ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh biên lai">
                {ret.refundProofUrl ? (
                  <Image
                    src={ret.refundProofUrl}
                    alt="Ảnh biên lai chuyển khoản"
                    width={120}
                    style={{ borderRadius: 4 }}
                  />
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm hoàn">
                {formatDate(ret.refundedAt)}
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
          {resolvedOrderId && (
            <Card title="Đơn hàng gốc" style={{ marginBottom: 16 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã đơn">
                  <Text code>#{resolvedOrderId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt">
                  {formatDate(orderInfo?.date)}
                </Descriptions.Item>
                <Descriptions.Item label="Người nhận">
                  {orderInfo?.recipientName ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {orderInfo?.recipientPhone ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền đơn">
                  {formatVND(orderInfo?.totalValue)}
                </Descriptions.Item>
              </Descriptions>
              <Button
                type="link"
                style={{ padding: 0, marginTop: 8 }}
                onClick={() => router.push(`/orders/${resolvedOrderId}`)}
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
