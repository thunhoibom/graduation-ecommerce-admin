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
  getStockTimelineBySku,
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
        label: `${variant.sku} · ${variant.productName ?? 'N/A'} · Tồn: ${variant.currentStock ?? 0}`,
        value: variant.id!,
        sku: variant.sku,
      })),
    [variants],
  )

  const {
    data: timeline,
    isLoading: timelineLoading,
    mutate: mutateTimeline,
  } = useAxiosSWR<StockAdjustmentPojo[]>(
    selectedSku ? [SWR_KEYS.STOCK_TIMELINE, selectedSku] : null,
    selectedSku ? async () => getStockTimelineBySku(selectedSku, { page: 0, size: 100 }) : null,
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
      mutateTimeline()
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
            title="Timeline tồn kho theo SKU"
            extra={
              <Select
                style={{ width: 320 }}
                showSearch
                optionFilterProp="label"
                options={variantOptions}
                value={variantOptions.find((item) => item.sku === selectedSku)?.value}
                placeholder="Chọn SKU để xem timeline"
                onChange={(variantId: number) => {
                  const selected = variantOptions.find((item) => item.value === variantId)
                  setSelectedSku(selected?.sku)
                }}
              />
            }
          >
            <Table
              rowKey="id"
              loading={timelineLoading}
              dataSource={timeline ?? []}
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
