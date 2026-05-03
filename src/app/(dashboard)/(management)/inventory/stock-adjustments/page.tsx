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

type AdjustmentFormValues = {
  variantId: number
  type: AdjustmentType
  quantity?: number
  targetStock?: number
  reason: string
  description?: string
}

const movementOptions = [
  { label: 'Nhập kho (INBOUND)', value: 'INBOUND' },
  { label: 'Xuất kho (OUTBOUND)', value: 'OUTBOUND' },
  { label: 'Điều chỉnh về tồn mục tiêu (ADJUSTMENT)', value: 'ADJUSTMENT' },
] as const

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
        label: `${variant.sku} · ${variant.productName ?? 'N/A'} · Tồn: ${variant.onHand ?? variant.currentStock ?? 0}`,
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
      render: (reason: string) => <Tag>{reason}</Tag>,
    },
    {
      title: 'Delta',
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
      title: 'Before',
      dataIndex: 'stockBefore',
      key: 'stockBefore',
      width: 90,
      align: 'right',
    },
    {
      title: 'After',
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
    return Array.from(reasons).map((reason) => ({ label: reason, value: reason }))
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
      title: 'Critical',
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
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho thực chiến' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>
          Tồn kho thực chiến
        </Title>
        <Text type="secondary">
          Nhập/xuất/điều chỉnh có lý do bắt buộc, timeline theo SKU, và đề xuất restock theo lịch sử bán.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">On-hand</Text>
            <Title level={4} style={{ margin: 0 }}>{kpi.onHand}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">Reserved</Text>
            <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>{kpi.reserved}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">Available to sell</Text>
            <Title level={4} style={{ margin: 0, color: '#389e0d' }}>{kpi.available}</Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">SKU low-stock</Text>
            <Title level={4} style={{ margin: 0, color: '#cf1322' }}>{kpi.lowStockSkus}</Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="Tạo phiếu điều chỉnh">
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Lý do là bắt buộc để truy vết audit."
            />
            <Form<AdjustmentFormValues>
              form={form}
              layout="vertical"
              onFinish={onSubmit}
              initialValues={{ type: 'INBOUND' }}
            >
              <Form.Item name="variantId" label="Biến thể (SKU)" rules={[{ required: true, message: 'Chọn biến thể' }]}>
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
              <Form.Item name="type" label="Loại nghiệp vụ" rules={[{ required: true, message: 'Chọn loại nghiệp vụ' }]}>
                <Select options={movementOptions as any} />
              </Form.Item>

              {adjustmentType === 'ADJUSTMENT' ? (
                <Form.Item
                  name="targetStock"
                  label="Tồn mục tiêu"
                  rules={[{ required: true, message: 'Nhập tồn mục tiêu' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="quantity"
                  label="Số lượng"
                  rules={[{ required: true, message: 'Nhập số lượng' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              )}

              <Form.Item name="reason" label="Lý do bắt buộc" rules={[{ required: true, message: 'Nhập lý do' }]}>
                <Input placeholder="VD: Bù thiếu kiểm kho đầu ca" />
              </Form.Item>
              <Form.Item name="description" label="Ghi chú thêm">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Xác nhận điều chỉnh
              </Button>
            </Form>
          </Card>
        </Col>

        <Col span={14}>
          <Card
            title="Inventory Ledger (lịch sử biến động)"
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
                  placeholder="Lọc theo reason"
                  options={reasonOptions}
                  value={ledgerReason}
                  onChange={(value) => setLedgerReason(value)}
                />
                <Select
                  style={{ width: 160 }}
                  value={ledgerLowStockOnly ? 'LOW_ONLY' : 'ALL'}
                  options={[
                    { label: 'Tất cả trạng thái', value: 'ALL' },
                    { label: 'Chỉ low-stock', value: 'LOW_ONLY' },
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
        title="Low-stock + đề xuất restock"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Text type="secondary">Lookback</Text>
            <InputNumber min={7} max={120} value={lookbackDays} onChange={(v) => setLookbackDays(Number(v ?? 30))} />
            <Text type="secondary">Lead time</Text>
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
