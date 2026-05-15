'use client'

import React, { useMemo, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  approveStockCount,
  completeStockCount,
  createStockCount,
  getStockCountById,
  listStockCounts,
  postStockCountVariance,
  startStockCount,
  upsertStockCountLines,
  type StockCountLinePojo,
  type StockCountLineUpsertRequest,
  type StockCountSessionCreateRequest,
  type StockCountSessionPojo,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'
import { useBarcodeScanner } from '@/shared/hooks/useBarcodeScanner'
import { playErrorBuzzer, playSuccessBeep } from '@/shared/utils/soundUtils'

const { Title, Text } = Typography

const statusColor: Record<string, string> = {
  PLANNED: 'default',
  IN_PROGRESS: 'blue',
  COUNTED: 'gold',
  APPROVED: 'purple',
  POSTED: 'green',
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Đã lên kế hoạch',
  IN_PROGRESS: 'Đang kiểm kê',
  COUNTED: 'Đã chốt đếm',
  APPROVED: 'Đã duyệt',
  POSTED: 'Đã hạch toán',
}

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))

type SessionSummary = {
  lineCount: number
  countedLines: number
  varianceLines: number
  surplusQty: number
  shortageQty: number
}

type StockCountCreateFormValues = Omit<StockCountSessionCreateRequest, 'plannedAt'> & {
  plannedAt?: Dayjs
}

const formatDate = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')

const getLineVariance = (line: StockCountLinePojo) =>
  line.varianceQty ?? (line.countedQty != null ? line.countedQty - line.expectedQty : 0)

const summarizeLines = (lines?: StockCountLinePojo[]): SessionSummary => {
  const items = lines ?? []
  let countedLines = 0
  let varianceLines = 0
  let surplusQty = 0
  let shortageQty = 0

  for (const line of items) {
    if (line.countedQty != null) countedLines += 1
    const variance = getLineVariance(line)
    if (variance === 0) continue
    varianceLines += 1
    if (variance > 0) surplusQty += variance
    else shortageQty += Math.abs(variance)
  }

  return {
    lineCount: items.length,
    countedLines,
    varianceLines,
    surplusQty,
    shortageQty,
  }
}

export default function InventoryStockCountsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedId, setSelectedId] = useState<number>()
  const [createOpen, setCreateOpen] = useState(false)
  const [lineOpen, setLineOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [detailKeyword, setDetailKeyword] = useState('')
  const [detailVarianceOnly, setDetailVarianceOnly] = useState(false)
  const [lineSearch, setLineSearch] = useState('')
  const [createForm] = Form.useForm<StockCountCreateFormValues>()
  const [lineForm] = Form.useForm<StockCountLineUpsertRequest>()

  const { data, isLoading, mutate } = useAxiosSWR<StockCountSessionPojo[]>(
    [SWR_KEYS.INVENTORY_STOCK_COUNTS, statusFilter],
    async () => listStockCounts(statusFilter),
    { revalidateOnMount: true },
  )

  const { data: detail, mutate: mutateDetail } = useAxiosSWR<StockCountSessionPojo>(
    selectedId ? [SWR_KEYS.INVENTORY_STOCK_COUNT_DETAIL, selectedId] : null,
    selectedId ? async () => getStockCountById(selectedId) : null,
    { revalidateOnMount: true },
  )

  const detailSummary = useMemo(() => summarizeLines(detail?.lines), [detail?.lines])
  const varianceRows = useMemo(
    () => (detail?.lines ?? []).filter((line) => getLineVariance(line) !== 0),
    [detail?.lines],
  )

  const detailRows = useMemo(() => {
    const keyword = detailKeyword.trim().toLowerCase()
    return (detail?.lines ?? []).filter((line) => {
      const matchesKeyword = keyword
        ? [line.variantSku, line.productName, line.reason]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(keyword))
        : true
      const matchesVariance = detailVarianceOnly ? getLineVariance(line) !== 0 : true
      return matchesKeyword && matchesVariance
    })
  }, [detail?.lines, detailKeyword, detailVarianceOnly])

  const kpi = useMemo(() => {
    const sessions = data ?? []
    return {
      total: sessions.length,
      active: sessions.filter((session) => session.status === 'PLANNED' || session.status === 'IN_PROGRESS').length,
      awaitingApproval: sessions.filter((session) => session.status === 'COUNTED').length,
      posted: sessions.filter((session) => session.status === 'POSTED').length,
    }
  }, [data])

  const openLineModal = () => {
    if (!detail) return
    lineForm.setFieldsValue({
      lines: detail.lines?.map((line) => ({
        variantId: line.variantId,
        countedQty: line.countedQty ?? line.expectedQty,
        reason: line.reason,
      })),
    })
    setLineSearch('')
    setScanMessage(null)
    setIsScanning(true)
    setLineOpen(true)
  }

  const refresh = () => {
    mutate()
    mutateDetail()
  }

  const runAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action()
      messageApi.success(successMsg)
      refresh()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể thực hiện thao tác')
    }
  }

  useBarcodeScanner({
    isActive: lineOpen && isScanning,
    onScan: (barcode) => {
      if (!detail?.lines) return

      const lines = lineForm.getFieldValue('lines') || []
      const matchedLineIndex = detail.lines.findIndex((line) => line.variantSku === barcode)

      if (matchedLineIndex === -1) {
        playErrorBuzzer()
        setScanMessage({ type: 'error', text: `Không tìm thấy SKU ${barcode} trong phiên kiểm kê này.` })
        return
      }

      const poLine = detail.lines[matchedLineIndex]
      const currentCounted = lines[matchedLineIndex]?.countedQty ?? poLine.expectedQty
      const newLines = [...lines]
      newLines[matchedLineIndex] = {
        ...newLines[matchedLineIndex],
        countedQty: currentCounted + 1,
      }
      lineForm.setFieldsValue({ lines: newLines })

      playSuccessBeep()
      setScanMessage({
        type: 'success',
        text: `Quét thành công: ${poLine.productName || poLine.variantSku} (+1)`,
      })
    },
  })

  const onCreate = async (values: StockCountCreateFormValues) => {
    setSubmitting(true)
    try {
      await createStockCount({
        warehouseId: values.warehouseId,
        locationCode: values.locationCode,
        note: values.note,
        requestedBy: values.requestedBy,
        plannedAt: values.plannedAt ? values.plannedAt.toISOString() : undefined,
      })
      messageApi.success('Đã tạo phiên kiểm kê')
      setCreateOpen(false)
      createForm.resetFields()
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể tạo phiên kiểm kê')
    } finally {
      setSubmitting(false)
    }
  }

  const onSaveLines = async (values: StockCountLineUpsertRequest) => {
    if (!selectedId) return

    const expectedByVariant = new Map(
      (detail?.lines ?? []).map((line) => [line.variantId, line.expectedQty]),
    )
    const missingReason = values.lines.find((line) => {
      const expected = expectedByVariant.get(line.variantId)
      return expected !== undefined && line.countedQty !== expected && !line.reason?.trim()
    })

    if (missingReason) {
      messageApi.error('Vui lòng nhập lý do cho các dòng có chênh lệch.')
      return
    }

    setSubmitting(true)
    try {
      await upsertStockCountLines(selectedId, values)
      messageApi.success('Đã cập nhật kết quả đếm')
      setLineOpen(false)
      refresh()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể lưu kết quả đếm')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<StockCountSessionPojo> = [
    { title: 'Mã phiên', dataIndex: 'code', width: 170, render: (v) => <Text code>{v}</Text> },
    { title: 'Kho', dataIndex: 'warehouseId', width: 100 },
    { title: 'Vị trí', dataIndex: 'locationCode', width: 110 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (s) => <Tag color={statusColor[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    {
      title: 'Số dòng',
      key: 'lineCount',
      width: 90,
      align: 'right',
      render: (_, record) => summarizeLines(record.lines).lineCount,
    },
    {
      title: 'Đã đếm',
      key: 'countedLines',
      width: 90,
      align: 'right',
      render: (_, record) => summarizeLines(record.lines).countedLines,
    },
    {
      title: 'Chênh lệch',
      key: 'varianceLines',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const count = summarizeLines(record.lines).varianceLines
        return count > 0 ? <Text style={{ color: '#cf1322' }}>{count}</Text> : count
      },
    },
    {
      title: 'Dự kiến',
      dataIndex: 'plannedAt',
      width: 140,
      render: (value?: string) => formatDate(value),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 140,
      render: (value?: string) => formatDate(value),
    },
    {
      title: 'Thao tác',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Button size="small" onClick={() => setSelectedId(record.id)}>Chi tiết</Button>
      ),
    },
  ]

  const detailColumns: ColumnsType<StockCountLinePojo> = [
    { title: 'SKU', dataIndex: 'variantSku', width: 150, render: (v) => <Text code>{v}</Text> },
    { title: 'Sản phẩm', dataIndex: 'productName', ellipsis: true },
    { title: 'Tồn hệ thống', dataIndex: 'expectedQty', width: 110, align: 'right' },
    {
      title: 'Đã đếm',
      dataIndex: 'countedQty',
      width: 90,
      align: 'right',
      render: (value?: number) => (value == null ? '—' : value),
    },
    {
      title: 'Chênh lệch',
      key: 'varianceQty',
      width: 100,
      align: 'right',
      render: (_, line) => {
        const value = getLineVariance(line)
        return (
          <Text style={{ color: value > 0 ? '#389e0d' : value < 0 ? '#cf1322' : undefined }}>
            {value > 0 ? `+${value}` : value}
          </Text>
        )
      },
    },
    { title: 'Lý do', dataIndex: 'reason', width: 220, ellipsis: true, render: (value?: string) => value || '—' },
  ]

  const varianceColumns: ColumnsType<StockCountLinePojo> = [
    { title: 'SKU', dataIndex: 'variantSku', width: 140, render: (v) => <Text code>{v}</Text> },
    { title: 'Sản phẩm', dataIndex: 'productName', ellipsis: true },
    {
      title: 'Chênh lệch',
      key: 'varianceQty',
      width: 100,
      align: 'right',
      render: (_, line) => {
        const value = getLineVariance(line)
        return (
          <Text strong style={{ color: value > 0 ? '#389e0d' : '#cf1322' }}>
            {value > 0 ? `+${value}` : value}
          </Text>
        )
      },
    },
    { title: 'Lý do', dataIndex: 'reason', ellipsis: true, render: (value?: string) => value || '—' },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Kiểm kê' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>Kiểm kê định kỳ</Title>
        <Text type="secondary">
          Lên kế hoạch, đếm tồn thực tế, duyệt chênh lệch và hạch toán điều chỉnh tồn kho.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Text type="secondary">Tổng phiên</Text>
            <Title level={4} style={{ margin: 0 }}>{kpi.total}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Text type="secondary">Đang kiểm kê</Text>
            <Title level={4} style={{ margin: 0, color: '#1677ff' }}>{kpi.active}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Text type="secondary">Chờ duyệt</Text>
            <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>{kpi.awaitingApproval}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Text type="secondary">Đã hạch toán</Text>
            <Title level={4} style={{ margin: 0, color: '#389e0d' }}>{kpi.posted}</Title>
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Lọc trạng thái"
              style={{ width: 220 }}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
            <Button type="primary" onClick={() => setCreateOpen(true)}>Tạo phiên kiểm kê</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data ?? []}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title={detail ? `Chi tiết ${detail.code}` : 'Chi tiết kiểm kê'}
        width={960}
        open={!!selectedId}
        onClose={() => {
          setSelectedId(undefined)
          setDetailKeyword('')
          setDetailVarianceOnly(false)
        }}
        extra={
          detail && (
            <Space wrap>
              {detail.status === 'PLANNED' && (
                <Button onClick={() => runAction(() => startStockCount(detail.id, {}), 'Đã bắt đầu kiểm kê')}>
                  Bắt đầu kiểm kê
                </Button>
              )}
              {detail.status === 'IN_PROGRESS' && (
                <>
                  <Button onClick={openLineModal}>Nhập kết quả đếm</Button>
                  <Button onClick={() => runAction(() => completeStockCount(detail.id, {}), 'Đã chốt kết quả đếm')}>
                    Chốt kết quả
                  </Button>
                </>
              )}
              {detail.status === 'COUNTED' && (
                <Button onClick={() => runAction(() => approveStockCount(detail.id, {}), 'Đã duyệt phiên kiểm kê')}>
                  Duyệt
                </Button>
              )}
              {detail.status === 'APPROVED' && (
                <Button
                  type="primary"
                  onClick={() => runAction(() => postStockCountVariance(detail.id, {}), 'Đã hạch toán chênh lệch')}
                >
                  Hạch toán chênh lệch
                </Button>
              )}
            </Space>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert
            type="info"
            showIcon
            message="Quy trình: lên kế hoạch → bắt đầu kiểm kê → nhập số đếm → chốt kết quả → duyệt → hạch toán chênh lệch."
          />

          <Card size="small">
            <Text>Kho/Vị trí: {detail?.warehouseId} / {detail?.locationCode}</Text><br />
            <Text>
              Trạng thái:{' '}
              <Tag color={statusColor[detail?.status ?? ''] ?? 'default'}>
                {STATUS_LABEL[detail?.status ?? ''] ?? detail?.status}
              </Tag>
            </Text><br />
            <Text>Dự kiến: {formatDate(detail?.plannedAt)}</Text><br />
            <Text>Chốt đếm: {formatDate(detail?.countedAt)}</Text><br />
            <Text>Duyệt: {formatDate(detail?.approvedAt)}</Text><br />
            <Text>Hạch toán: {formatDate(detail?.postedAt)}</Text><br />
            <Text>Số dòng: {detailSummary.lineCount}</Text><br />
            <Text>Đã đếm: {detailSummary.countedLines}</Text><br />
            <Text>Dòng chênh lệch: {detailSummary.varianceLines}</Text><br />
            <Text>Thừa: +{detailSummary.surplusQty} · Thiếu: -{detailSummary.shortageQty}</Text><br />
            <Text>Ghi chú: {detail?.note || '—'}</Text>
          </Card>

          <Card
            size="small"
            title="Danh sách đếm"
            extra={
              <Space wrap>
                <Input
                  allowClear
                  placeholder="Tìm SKU/tên/lý do"
                  style={{ width: 220 }}
                  value={detailKeyword}
                  onChange={(e) => setDetailKeyword(e.target.value)}
                />
                <Select
                  style={{ width: 180 }}
                  value={detailVarianceOnly ? 'VARIANCE_ONLY' : 'ALL'}
                  options={[
                    { label: 'Tất cả dòng', value: 'ALL' },
                    { label: 'Chỉ chênh lệch', value: 'VARIANCE_ONLY' },
                  ]}
                  onChange={(value) => setDetailVarianceOnly(value === 'VARIANCE_ONLY')}
                />
              </Space>
            }
          >
            <Table
              rowKey="id"
              dataSource={detailRows}
              pagination={{ pageSize: 8 }}
              columns={detailColumns}
              scroll={{ x: 900 }}
              size="small"
            />
          </Card>

          {varianceRows.length > 0 && (
            <Card size="small" title="Tóm tắt chênh lệch">
              <Space size={24} wrap style={{ marginBottom: 12 }}>
                <Text>Số dòng chênh lệch: <Text strong>{detailSummary.varianceLines}</Text></Text>
                <Text>Thừa: <Text strong style={{ color: '#389e0d' }}>+{detailSummary.surplusQty}</Text></Text>
                <Text>Thiếu: <Text strong style={{ color: '#cf1322' }}>-{detailSummary.shortageQty}</Text></Text>
              </Space>
              <Table
                rowKey="id"
                dataSource={varianceRows}
                pagination={false}
                columns={varianceColumns}
                size="small"
                scroll={{ x: 700 }}
              />
            </Card>
          )}
        </Space>
      </Drawer>

      <Modal
        title="Tạo phiên kiểm kê"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={onCreate}
          initialValues={{ warehouseId: 'MAIN', locationCode: 'MAIN-A1' }}
        >
          <Form.Item name="warehouseId" label="Kho"><Input /></Form.Item>
          <Form.Item name="locationCode" label="Vị trí"><Input /></Form.Item>
          <Form.Item name="plannedAt" label="Thời điểm dự kiến">
            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
            <span>Nhập kết quả đếm</span>
            <Space>
              <Text style={{ fontSize: 14, fontWeight: 'normal' }}>Chế độ quét:</Text>
              <Switch checked={isScanning} onChange={setIsScanning} />
            </Space>
          </div>
        }
        open={lineOpen}
        onCancel={() => setLineOpen(false)}
        onOk={() => lineForm.submit()}
        confirmLoading={submitting}
        width={860}
      >
        {isScanning && (
          <Alert
            message="Đang ở chế độ quét mã vạch. Mỗi lần quét sẽ tăng số lượng đếm thêm 1."
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
        {scanMessage && (
          <Alert
            message={scanMessage.text}
            type={scanMessage.type}
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
        <Input
          allowClear
          placeholder="Tìm SKU hoặc tên sản phẩm"
          value={lineSearch}
          onChange={(e) => setLineSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Form form={lineForm} layout="vertical" onFinish={onSaveLines}>
          <Form.List name="lines">
            {(fields) => (
              <Space direction="vertical" style={{ width: '100%', maxHeight: 460, overflowY: 'auto' }}>
                {fields.map((field) => {
                  const line = detail?.lines?.[field.name]
                  const keyword = lineSearch.trim().toLowerCase()
                  const visible = keyword
                    ? [line?.variantSku, line?.productName]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(keyword))
                    : true
                  if (!visible) return null

                  return (
                    <Card key={field.key} size="small">
                      <Text strong>{line?.productName || 'Chưa rõ'}</Text>
                      <br />
                      <Text type="secondary">SKU: <Text code>{line?.variantSku}</Text> · Tồn hệ thống: {line?.expectedQty ?? 0}</Text>
                      <Form.Item name={[field.name, 'variantId']} hidden><InputNumber /></Form.Item>
                      <Row gutter={12} style={{ marginTop: 8 }}>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'countedQty']}
                            label="Số lượng đếm"
                            rules={[{ required: true, message: 'Nhập số lượng đếm' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item name={[field.name, 'reason']} label="Lý do chênh lệch" style={{ marginBottom: 0 }}>
                            <Input placeholder="Bắt buộc nếu khác tồn hệ thống" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  )
                })}
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  )
}
