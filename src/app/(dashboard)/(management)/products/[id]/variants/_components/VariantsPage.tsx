'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form,
  Input, InputNumber, Select, Breadcrumb, Spin, message,
  Popconfirm, Row, Col, Switch,
} from 'antd'
import {
  ArrowLeftOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  getProductById,
  type ProductVariantPojo,
  type ProductPojo,
  type PageResponse as VariantPageResponse,
} from '@/services/rest-api/app-api/products/product-service'

const { Title, Text } = Typography
const { TextArea } = Input

type PR<T> = { success: boolean; message?: string; data: T; totalElements: number; totalPages: number; currentPage: number; pageSize: number }

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

interface VariantFormData {
  id?: number
  sku?: string
  size?: string
  color?: string
  attributes?: string
  priceModifier?: number
  currentStock?: number
  criticalStock?: number
  active?: boolean
  barcode?: string
}

interface VariantsPageProps {
  productId: string
}

const VariantsPage: React.FC<VariantsPageProps> = ({ productId }) => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState({ page: 1, size: 100 })
  const [searchText, setSearchText] = useState('')

  // Load product info
  const { data: product } = useAxiosSWR<ProductPojo>(
    [SWR_KEYS.PRODUCT_DETAIL, productId],
    async () => getProductById(Number(productId)),
    { revalidateOnMount: true },
  )

  // Load variants
  const { data: variantsData, isLoading, mutate } = useAxiosSWR<VariantPageResponse<ProductVariantPojo[]>>(
    product?.barcode ? ['product-variants', productId, queryParams] : null,
    product?.barcode
      ? async () => searchVariants({
          productBarcode: product.barcode,
          ...queryParams,
        } as never)
      : null,
    { revalidateOnMount: true },
  )

  const allVariants = variantsData?.data ?? []

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariantPojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // ── Handlers ────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    setEditingVariant(null)
    form.resetFields()
    form.setFieldsValue({ active: true, priceModifier: 0, currentStock: 0, criticalStock: 0 })
    setFormOpen(true)
  }, [form])

  const handleEdit = useCallback((record: ProductVariantPojo) => {
    setEditingVariant(record)
    form.setFieldsValue({
      sku: record.sku,
      size: record.size,
      color: record.color,
      attributes: record.attributes,
      priceModifier: record.priceModifier ?? 0,
      currentStock: record.currentStock ?? 0,
      criticalStock: record.criticalStock ?? 0,
      active: record.active !== false,
      barcode: record.barcode,
    })
    setFormOpen(true)
  }, [form])

  const handleDelete = useCallback(async (record: ProductVariantPojo) => {
    try {
      if (record.id) await deleteVariant(record.id)
      messageApi.success('Xóa biến thể thành công')
      mutate()
    } catch {
      messageApi.error('Xóa biến thể thất bại')
    }
  }, [mutate, messageApi])

  const handleFormSubmit = async (values: VariantFormData) => {
    setSubmitting(true)
    try {
      const payload: ProductVariantPojo = {
        ...values,
        productBarcode: product!.barcode,
        productName: product!.name,
        productBasePrice: product!.price,
        finalPrice: product!.price + (values.priceModifier ?? 0),
      }

      if (editingVariant?.id) {
        await updateVariant(editingVariant.id, payload)
        messageApi.success('Cập nhật biến thể thành công')
      } else {
        await createVariant(payload)
        messageApi.success('Tạo biến thể thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered variants for display
  const filteredVariants = searchText
    ? allVariants.filter((v) =>
        (v.sku ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
        (v.size ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
        (v.color ?? '').toLowerCase().includes(searchText.toLowerCase()),
      )
    : allVariants

  // ── Columns ────────────────────────────────────────────────

  const columns: ColumnsType<ProductVariantPojo> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (s: string) => s ? <Text code style={{ fontSize: 12 }}>{s}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
      align: 'center' as const,
      render: (s: string) => s ? <Tag>{s}</Tag> : '—',
    },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (c: string) => c || '—',
    },
    {
      title: 'Giá điều chỉnh',
      dataIndex: 'priceModifier',
      key: 'priceModifier',
      width: 130,
      align: 'right' as const,
      render: (v: number | undefined) => (
        <Text type={v && v > 0 ? 'success' : v && v < 0 ? 'danger' : 'secondary'}>
          {v && v !== 0 ? (v > 0 ? `+${formatVND(v)}` : formatVND(v)) : '—'}
        </Text>
      ),
    },
    {
      title: 'Giá bán',
      key: 'finalPrice',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Text strong>{formatVND(record.finalPrice ?? (product?.price ?? 0) + (record.priceModifier ?? 0))}</Text>
      ),
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariantPojo) => {
        const stock = record.currentStock ?? 0
        return <Tag color={stock === 0 ? 'red' : stock < (record.criticalStock ?? 5) ? 'orange' : 'green'}>{stock}</Tag>
      },
    },
    {
      title: 'Còn trống',
      dataIndex: 'availableStock',
      key: 'availableStock',
      width: 100,
      align: 'center' as const,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Đã đặt',
      dataIndex: 'reservedStock',
      key: 'reservedStock',
      width: 90,
      align: 'center' as const,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Hoạt động',
      dataIndex: 'active',
      key: 'active',
      width: 90,
      align: 'center' as const,
      render: (a: boolean) => (
        <Switch checked={a !== false} size="small" disabled />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Sửa"
          />
          <Popconfirm
            title="Xóa biến thể?"
            description="Hành động này không thể hoàn tác."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/products/list')}>Sản phẩm</a> },
            { title: <a onClick={() => router.push(`/products/${productId}`)}>{product?.name ?? `#${productId}`}</a> },
            { title: 'Biến thể' },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/products/${productId}`)}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý biến thể
          </Title>
          <Text type="secondary">
            {product ? `${product.name} — ${product.barcode}` : `Sản phẩm #${productId}`}
          </Text>
        </div>
      </div>

      {/* Filters + Add button */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="Tìm SKU, size, màu..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(v) => setSearchText(v)}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm biến thể
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table
        dataSource={filteredVariants}
        rowKey="id"
        columns={columns}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 1100 }}
        size="middle"
        locale={{
          emptyText: isLoading ? 'Đang tải...' : 'Chưa có biến thể nào — nhấn "Thêm biến thể" để tạo',
        }}
        footer={() => (
          <Text type="secondary">
            Tổng cộng: {filteredVariants.length} biến thể
            {filteredVariants.length !== allVariants.length && ` (đã lọc từ ${allVariants.length})`}
          </Text>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingVariant ? 'Sửa biến thể' : 'Thêm biến thể mới'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ active: true, priceModifier: 0 }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Nhập SKU' }]}>
                <Input placeholder="VD: SP001-XL-RED" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label="Barcode">
                <Input placeholder="Barcode biến thể (tùy chọn)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="size" label="Size" rules={[{ required: true, message: 'Nhập size' }]}>
                <Select
                  placeholder="Chọn size"
                  options={[
                    { label: 'XS', value: 'XS' },
                    { label: 'S', value: 'S' },
                    { label: 'M', value: 'M' },
                    { label: 'L', value: 'L' },
                    { label: 'XL', value: 'XL' },
                    { label: 'XXL', value: 'XXL' },
                    { label: 'XXXL', value: 'XXXL' },
                    { label: 'Đặc biệt', value: 'SPECIAL' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="color" label="Màu sắc">
                <Input placeholder="VD: Đỏ, Xanh Navy, Đen" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priceModifier" label="Điều chỉnh giá (VND)">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: +50000 hoặc -10000"
                  formatter={(v) => {
                    const n = Number(v)
                    return Number.isNaN(n) ? '' : String(n)
                  }}
                  parser={(v) => {
                    if (!v) return 0
                    return Number(v.replace(/,/g, '')) || 0
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giá bán (thành phẩm)">
                <Input
                  value={formatVND(
                    (product?.price ?? 0) +
                    Number(form.getFieldValue('priceModifier') ?? 0),
                  )}
                  disabled
                  style={{ color: '#52c41a', fontWeight: 600 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="currentStock" label="Tồn kho">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="criticalStock" label="Ngưỡng cảnh báo">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="attributes" label="Thuộc tính bổ sung">
            <TextArea rows={2} placeholder="VD: Chất liệu: 100% Cotton, Co giãn 4 chiều" />
          </Form.Item>

          <Form.Item name="active" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              {editingVariant ? 'Lưu thay đổi' : 'Tạo biến thể'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default VariantsPage
