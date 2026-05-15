'use client'

import React, { useMemo, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import { searchVariants, type ProductVariantPojo } from '@/services/rest-api/app-api/products/product-service'
import {
  getRestockSuggestions,
  listStockAdjustments,
  recordStockAdjustment,
  type AdjustmentType,
  type RestockSuggestionPojo,
  type StockAdjustmentPojo,
} from '@/services/rest-api/app-api/inventory/stock-adjustment-service'

const { Title, Text } = Typography

const SYSTEM_REASON_LABEL: Record<string, string> = {
  RESERVATION_CREATED: 'Giữ chỗ trong giỏ',
  RESERVATION_RELEASED: 'Huỷ giữ chỗ',
  PAYMENT_CONFIRMED: 'Thanh toán thành công',
  PAYMENT_ABORTED: 'Huỷ thanh toán',
  RETURN_RESTORED: 'Hoàn hàng về kho',
  MANUAL_ADJUSTMENT: 'Điều chỉnh thủ công',
  STOCK_RECOUNT: 'Kiểm kê tồn',
  ORDER_CANCELLED: 'Huỷ đơn hàng',
  ORDER_REJECTED: 'Từ chối đơn hàng',
  PURCHASE_ORDER_RECEIPT: 'Nhập kho theo đơn mua',
  TRANSFER_OUTBOUND: 'Chuyển kho đi',
  TRANSFER_INBOUND: 'Chuyển kho đến',
  STOCK_COUNT_VARIANCE: 'Chênh lệch kiểm kê',
}

const formatSystemReason = (reason?: string) =>
  reason ? (SYSTEM_REASON_LABEL[reason] ?? reason) : '—'

const movementOptions = [
  { label: 'Nhập kho', value: 'INBOUND' },
  { label: 'Xuất kho', value: 'OUTBOUND' },
  { label: 'Điều chỉnh tồn', value: 'ADJUSTMENT' },
] as const

type AdjustmentFormValues = {
  variantId: number
  type: AdjustmentType
  quantity?: number
  targetStock?: number
  reason: string
  description?: string
}

export default function StockAdjustmentsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<AdjustmentFormValues>()
  const [selectedSku, setSelectedSku] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [lookbackDays, setLookbackDays] = useState(30)
  const [leadTimeDays, setLeadTimeDays] = useState(14)
  const [ledgerKeyword, setLedgerKeyword] = useState('')
  const [ledgerLowStockOnly, setLedgerLowStockOnly] = useState(false)
  const [ledgerReason, setLedgerReason] = useState<string>()

  const adjustmentType = Form.useWatch('type', form)

  const { data: variantsResponse } = useAxiosSWR<{ items: ProductVariantPojo[] }>(
    [SWR_KEYS.VARIANT_LIST, 'stock-adjustments-picker'],
    async () => searchVariants({ pageIndex: 0, pageSize: 500 }),
    { revalidateOnMount: true },
  )

  const variants = variantsResponse?.items ?? []

  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        label: `${variant.sku} · ${variant.productName ?? 'Chưa rõ'} · Tồn: ${variant.onHand ?? variant.currentStock ?? 0}`,
        value: variant.id!,
        sku: variant.sku,
      })),
    [variants],
  )

  const {
    data: ledgerResponse,
    isLoading: ledgerLoading,
    mutate: mutateLedger,
  } = useAxiosSWR<{ items: StockAdjustmentPojo[]; totalCount?: number }>(
    [SWR_KEYS.STOCK_TIMELINE, 'all-ledger'],
    async () => listStockAdjustments({ page: 0, size: 500 }),
    { revalidateOnMount: true },
  )

  const {
    data: restockSuggestions,
    isLoading: restockLoading,
    mutate: mutateRestock,
  } = useAxiosSWR<RestockSuggestionPojo[]>(
    [SWR_KEYS.RESTOCK_SUGGESTIONS, lookbackDays, leadTimeDays],
    async () => getRestockSuggestions({ lookbackDays, leadTimeDays }),
    { revalidateOnMount: true },
  )

  const onSubmit = async (values: AdjustmentFormValues) => {
    const selectedVariant = variants.find((v) => v.id === values.variantId)
    if (!selectedVariant) {
      messageApi.error('Không tìm thấy biến thể được chọn.')
      return
    }

    setSubmitting(true)
    try {
      await recordStockAdjustment({
        variantId: values.variantId,
        type: values.type,
        quantity: values.quantity,
        targetStock: values.targetStock,
        reason: values.reason,
        description: values.description,
      })
      messageApi.success('Ghi nhận điều chỉnh tồn kho thành công.')
      setSelectedSku(selectedVariant.sku)
      mutateLedger()
      mutateRestock()
      form.resetFields()
      form.setFieldsValue({ type: 'INBOUND' })
    } catch (error) {
      messageApi.error((error as Error)?.message ?? 'Không thể điều chỉnh tồn kho.')
    } finally {
      setSubmitting(false)
    }
  }

  const timelineColumns: ColumnsType<StockAdjustmentPojo> = [
    {
      title: 'Thời gian',
      dataIndex: 'date',
      key: 'date',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'SKU',
      dataIndex: 'variantSku',
      key: 'variantSku',
      width: 160,
      render: (sku?: string) => <Text code>{sku ?? '-'}</Text>,
    },
    {
      title: 'Lý do hệ thống',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      render: (reason: string) => <Tag>{formatSystemReason(reason)}</Tag>,
    },
    {
      title: 'Biến động',
      dataIndex: 'quantityDelta',
      key: 'quantityDelta',
      width: 90,
      align: 'right',
      render: (delta: number) => (
        <Text style={{ color: delta > 0 ? '#389e0d' : delta < 0 ? '#cf1322' : '#595959' }}>
          {delta > 0 ? `+${delta}` : delta}
        </Text>
      ),
    },
    {
      title: 'Trước',
      dataIndex: 'stockBefore',
      key: 'stockBefore',
      width: 90,
      align: 'right',
    },
    {
      title: 'Sau',
      dataIndex: 'stockAfter',
      key: 'stockAfter',
      width: 90,
      align: 'right',
      render: (stock: number) => <Text strong>{stock}</Text>,
    },
    {
      title: 'Chi tiết',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ]

  const kpi = useMemo(() => {
    const totals = variants.reduce(
      (acc, variant) => {
        const onHand = variant.onHand ?? variant.currentStock ?? 0
        const reserved = variant.reserved ?? variant.reservedStock ?? 0
        const available = variant.availableToSell ?? variant.availableStock ?? Math.max(0, onHand - reserved)
        const critical = variant.criticalStock ?? 0
        acc.onHand += onHand
        acc.reserved += reserved
        acc.available += available
        if (available <= critical) {
          acc.lowStockSkus += 1
        }
        return acc
      },
      { onHand: 0, reserved: 0, available: 0, lowStockSkus: 0 }
    )
    return totals
  }, [variants])

  const lowStockSkuSet = useMemo(() => {
    const set = new Set<string>()
    variants.forEach((variant) => {
      const sku = variant.sku
      const onHand = variant.onHand ?? variant.currentStock ?? 0
      const reserved = variant.reserved ?? variant.reservedStock ?? 0
      const available = variant.availableToSell ?? variant.availableStock ?? Math.max(0, onHand - reserved)
      const critical = variant.criticalStock ?? 0
      if (sku && available <= critical) {
        set.add(sku)
      }
    })
    return set
  }, [variants])

  const reasonOptions = useMemo(() => {
    const reasons = new Set((ledgerResponse?.items ?? []).map((item) => item.reason).filter(Boolean))
    return Array.from(reasons).map((reason) => ({ label: formatSystemReason(reason), value: reason }))
  }, [ledgerResponse?.items])

  const ledgerRows = useMemo(() => {
    const keyword = ledgerKeyword.trim().toLowerCase()
    return (ledgerResponse?.items ?? []).filter((item) => {
      const matchesSku = selectedSku ? item.variantSku === selectedSku : true
      const matchesReason = ledgerReason ? item.reason === ledgerReason : true
      const matchesKeyword = keyword
        ? [item.variantSku, item.productName, item.description]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(keyword))
        : true
      const matchesLowStock = ledgerLowStockOnly
        ? !!item.variantSku && lowStockSkuSet.has(item.variantSku)
        : true
      return matchesSku && matchesReason && matchesKeyword && matchesLowStock
    })
  }, [ledgerKeyword, ledgerLowStockOnly, ledgerReason, ledgerResponse?.items, lowStockSkuSet, selectedSku])

  const suggestionColumns: ColumnsType<RestockSuggestionPojo> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 160,
      render: (sku: string) => <Text code>{sku}</Text>,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: 'Tồn hiện tại',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 110,
      align: 'right',
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'criticalStock',
      key: 'criticalStock',
      width: 90,
      align: 'right',
    },
    {
      title: 'Bán/Ngày',
      dataIndex: 'avgDailySold',
      key: 'avgDailySold',
      width: 100,
      align: 'right',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Đề xuất nhập',
      dataIndex: 'recommendedRestockQty',
      key: 'recommendedRestockQty',
      width: 130,
      align: 'right',
      render: (qty: number) => (
        <Tag color={qty > 0 ? 'orange' : 'green'} style={{ fontWeight: 600 }}>
          {qty}
        </Tag>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Điều chỉnh tồn' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>
          Điều chỉnh tồn kho
        </Title>
        <Text type="secondary">
          Nhập, xuất hoặc điều chỉnh tồn có lý do bắt buộc; xem lịch sử biến động theo SKU và đề xuất nhập bổ sung theo lịch sử bán.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">Tồn thực tế</Text>
            <Title level={4} style={{ margin: 0 }}>{kpi.onHand}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">Đang giữ</Text>
            <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>{kpi.reserved}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">Có thể bán</Text>
            <Title level={4} style={{ margin: 0, color: '#389e0d' }}>{kpi.available}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">SKU sắp hết</Text>
            <Title level={4} style={{ margin: 0, color: '#cf1322' }}>{kpi.lowStockSkus}</Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={8} xl={7}>
          <Card title="Tạo phiếu điều chỉnh" size="small">
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12, padding: '6px 10px' }}
              message="Lý do là bắt buộc để truy vết lịch sử."
            />
            <Form<AdjustmentFormValues>
              form={form}
              layout="vertical"
              size="small"
              onFinish={onSubmit}
              initialValues={{ type: 'INBOUND' }}
              requiredMark={false}
            >
              <Row gutter={8}>
                <Col span={24}>
                  <Form.Item name="variantId" label="Biến thể (SKU)" rules={[{ required: true, message: 'Chọn biến thể' }]} style={{ marginBottom: 12 }}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={variantOptions}
                      placeholder="Chọn SKU"
                      onChange={(variantId: number) => {
                        const selected = variantOptions.find((item) => item.value === variantId)
                        setSelectedSku(selected?.sku)
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="type" label="Loại nghiệp vụ" rules={[{ required: true, message: 'Chọn loại nghiệp vụ' }]} style={{ marginBottom: 12 }}>
                    <Select options={movementOptions as any} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {adjustmentType === 'ADJUSTMENT' ? (
                    <Form.Item
                      name="targetStock"
                      label="Tồn mục tiêu"
                      rules={[{ required: true, message: 'Nhập tồn mục tiêu' }]}
                      style={{ marginBottom: 12 }}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="quantity"
                      label="Số lượng"
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                      style={{ marginBottom: 12 }}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  )}
                </Col>
                <Col span={24}>
                  <Form.Item name="reason" label="Lý do bắt buộc" rules={[{ required: true, message: 'Nhập lý do' }]} style={{ marginBottom: 12 }}>
                    <Input placeholder="VD: Bù thiếu kiểm kho đầu ca" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Ghi chú thêm" style={{ marginBottom: 12 }}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                Xác nhận điều chỉnh
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={16} xl={17}>
          <Card
            title="Sổ biến động tồn kho"
            extra={
              <Space>
                <Select
                  style={{ width: 240 }}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={variantOptions}
                  value={variantOptions.find((item) => item.sku === selectedSku)?.value}
                  placeholder="Lọc theo SKU"
                  onChange={(variantId: number) => {
                    if (!variantId) {
                      setSelectedSku(undefined)
                      return
                    }
                    const selected = variantOptions.find((item) => item.value === variantId)
                    setSelectedSku(selected?.sku)
                  }}
                />
                <Input
                  allowClear
                  style={{ width: 220 }}
                  placeholder="Tìm SKU/tên/ghi chú"
                  value={ledgerKeyword}
                  onChange={(e) => setLedgerKeyword(e.target.value)}
                />
                <Select
                  allowClear
                  style={{ width: 180 }}
                  placeholder="Lọc theo lý do hệ thống"
                  options={reasonOptions}
                  value={ledgerReason}
                  onChange={(value) => setLedgerReason(value)}
                />
                <Select
                  style={{ width: 160 }}
                  value={ledgerLowStockOnly ? 'LOW_ONLY' : 'ALL'}
                  options={[
                    { label: 'Tất cả trạng thái', value: 'ALL' },
                    { label: 'Chỉ SKU sắp hết', value: 'LOW_ONLY' },
                  ]}
                  onChange={(value) => setLedgerLowStockOnly(value === 'LOW_ONLY')}
                />
              </Space>
            }
          >
            <Table
              rowKey="id"
              loading={ledgerLoading}
              dataSource={ledgerRows}
              columns={timelineColumns}
              pagination={{ pageSize: 8 }}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="SKU sắp hết và đề xuất nhập bổ sung"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Text type="secondary">Kỳ xem bán (ngày)</Text>
            <InputNumber min={7} max={120} value={lookbackDays} onChange={(v) => setLookbackDays(Number(v ?? 30))} />
            <Text type="secondary">Thời gian giao hàng (ngày)</Text>
            <InputNumber min={1} max={60} value={leadTimeDays} onChange={(v) => setLeadTimeDays(Number(v ?? 14))} />
            <Button onClick={() => mutateRestock()}>Làm mới</Button>
          </Space>
        }
      >
        <Table
          rowKey="variantId"
          loading={restockLoading}
          dataSource={restockSuggestions ?? []}
          columns={suggestionColumns}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  )
}
