'use client'

import React, { Suspense, useState, useCallback, useMemo } from 'react'
import { Typography, Breadcrumb, Card, Table, Tag, Space, Button, Modal, Form, Input, InputNumber, message, Row, Col, Upload, Image as AntdImage, Select, Alert } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getProductById,
  searchVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  type ProductPojo,
  type ProductVariantPojo,
  type ImagePojo,
  type VariantSearchParams,
} from '@/services/rest-api/app-api/products/product-service'
import { getParamsByCategory, type ParamPojo } from '@/services/rest-api/app-api/settings/settings-service'
import { uploadImage } from '@/services/rest-api/app-api/media/media-service'

import AppTable from '@/shared/components/antd/AppTable'
import BulkOperationsModal from '../../_components/bulk/BulkOperationsModal'
import { useTableFetchingParamsForVariants, DEFAULT_VARIANT_PARAMS, type DefaultVariantParams } from '../../_hooks/use-fetch-variants'

const { Title, Text } = Typography
const { Option } = Select

const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const DEFAULT_COLOR_OPTIONS = ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Vàng', 'Be', 'Nâu', 'Xám', 'Hồng', 'Tím']

type MatrixPreviewRow = {
  key: string
  sku: string
  size: string
  color: string
  canCreate: boolean
  reason?: string
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const normalizeSkuPart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')

const buildAutoVariantSku = (
  productBarcode: string,
  size: string,
  color: string | undefined,
  existingSkus: string[]
) => {
  const base = `${normalizeSkuPart(productBarcode)}-${normalizeSkuPart(size)}-${normalizeSkuPart(color || 'NA')}`
  const existing = new Set(existingSkus.map((sku) => sku.toUpperCase()))
  if (!existing.has(base)) {
    return base
  }

  let counter = 2
  while (existing.has(`${base}-${counter}`)) {
    counter += 1
  }
  return `${base}-${counter}`
}

const toCombinationKey = (size: string | undefined, color: string | undefined) =>
  `${(size ?? '').trim().toUpperCase()}::${(color ?? '').trim().toUpperCase()}`

const parseOptionList = (rawValue: string | undefined): string[] => {
  if (!rawValue) {
    return []
  }
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0)
      }
    } catch {
      // Fallback to plain delimiter parsing.
    }
  }

  return trimmed
    .split(/[,\n;|]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

const VariantManagementView: React.FC = () => {
  const params = useParams()
  const productId = params.id as string
  const [messageApi, contextHolder] = message.useMessage()

  // Load product info
  const { data: product } = useAxiosSWR<ProductPojo>(
    [SWR_KEYS.PRODUCT_DETAIL, productId],
    async () => getProductById(Number(productId)),
    { revalidateOnMount: true },
  )

  const barcode = product?.barcode

  const { data: optionSetParams } = useAxiosSWR<{ data: ParamPojo[] }>(
    [SWR_KEYS.PARAMS_BY_CATEGORY, 'variant-option-sets'],
    async () => {
      const res = await getParamsByCategory('variant_option_set')
      return { data: res.data ?? [] }
    },
    { revalidateOnMount: true },
  )

  const sizeOptions = useMemo(() => {
    const params = optionSetParams?.data ?? []
    const sizeParam = params.find((item) => item.name?.toLowerCase() === 'size')
    const parsed = parseOptionList(sizeParam?.value)
    return parsed.length > 0 ? parsed : DEFAULT_SIZE_OPTIONS
  }, [optionSetParams?.data])

  const colorOptions = useMemo(() => {
    const params = optionSetParams?.data ?? []
    const colorParam = params.find((item) => item.name?.toLowerCase() === 'color')
    const parsed = parseOptionList(colorParam?.value)
    return parsed.length > 0 ? parsed : DEFAULT_COLOR_OPTIONS
  }, [optionSetParams?.data])

  const { queryParams, setTableFetchingParams } = useTableFetchingParamsForVariants<DefaultVariantParams>({
    ...DEFAULT_VARIANT_PARAMS,
    productBarcode: barcode || '',
  })


  // Load variants
  const { data: variantData, isLoading, mutate } = useAxiosSWR<{
    data: ProductVariantPojo[]
    totalElements: number
  }>(
    barcode ? [SWR_KEYS.VARIANT_LIST, barcode, queryParams] : null,
    barcode
      ? async () => {
          // Create string-compatible params for the API
          const apiParams = {
            productBarcode: barcode,
            pageIndex: Number(queryParams.pageIndex),
            pageSize: queryParams.pageSize,
          }
          const res = await searchVariants(apiParams as any)
          return {
            data: res.items ?? [],
            totalElements: res.totalCount ?? 0,
          }
        }
      : null,
    { revalidateOnMount: true },
  )


  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariantPojo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const [matrixModalOpen, setMatrixModalOpen] = useState(false)
  const [matrixSubmitting, setMatrixSubmitting] = useState(false)
  const [matrixForm] = Form.useForm()
  const watchedSize = Form.useWatch('size', form) as string | undefined
  const watchedColor = Form.useWatch('color', form) as string | undefined
  const matrixSizes = Form.useWatch('sizes', matrixForm) as string[] | undefined
  const matrixColors = Form.useWatch('colors', matrixForm) as string[] | undefined

  // Bulk modal + row selection
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [selectedVariantIds, setSelectedVariantIds] = useState<React.Key[]>([])


  const columns: ColumnsType<ProductVariantPojo> = [
    {
      title: 'Ảnh',
      key: 'image',
      width: 70,
      render: (_: unknown, record: ProductVariantPojo) => {
        const url = record.primaryImageUrl || record.images?.[0]?.url
        return url ? (
          <AntdImage
            src={url}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : <div style={{ width: 48, height: 48, backgroundColor: '#f5f5f5', borderRadius: 4 }} />
      }
    },
    {
      title: 'SKU',

      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      render: (sku: string) => <Text code style={{ fontSize: 12 }}>{sku}</Text>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: string) => <Tag color="blue">{size}</Tag>,
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) => color || <Text type="secondary">—</Text>,
    },
    {
      title: 'Giá cơ bản',
      key: 'basePrice',
      width: 130,
      align: 'right',
      render: (_: unknown, record: ProductVariantPojo) => {
        const base = record.productBasePrice ?? 0
        const modifier = record.priceModifier ?? 0
        return (
          <Space orientation="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 11 }}>Giá gốc</Text>
            <Text style={{ color: '#595959' }}>{formatVND(base)}</Text>
          </Space>
        )
      },
    },
    {
      title: 'Modifier',
      dataIndex: 'priceModifier',
      key: 'priceModifier',
      width: 100,
      align: 'right',
      render: (m: number | undefined) => (
        m ? (
          <Text style={{ color: m > 0 ? '#52c41a' : '#ff4d4f' }}>
            {m > 0 ? `+${formatVND(m)}` : formatVND(m)}
          </Text>
        ) : <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Giá cuối',
      key: 'finalPrice',
      width: 130,
      align: 'right',
      render: (_: unknown, record: ProductVariantPojo) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(record.finalPrice)}
        </Text>
      ),
    },
    {
      title: 'Tồn thực tế',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      render: (stock: number | undefined) => <Text>{stock ?? 0}</Text>,
    },
    {
      title: 'Giữ chỗ',
      dataIndex: 'reservedStock',
      key: 'reservedStock',
      width: 100,
      align: 'right',
      render: (reserved: number | undefined) => (
        <Text type={reserved && reserved > 0 ? 'warning' : 'secondary'}>
          {reserved ?? 0}
        </Text>
      ),
    },
    {
      title: 'Khả dụng',
      dataIndex: 'availableStock',
      key: 'availableStock',
      width: 100,
      align: 'right',
      render: (available: number | undefined, record: ProductVariantPojo) => {
        const critical = record.criticalStock ?? 5
        const color = !available ? 'red' : available <= critical ? 'orange' : 'green'
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {available ?? 0}
          </Tag>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: boolean | undefined) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Hoạt động' : 'Khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingVariant(record)
              
              // Set file list from variant images
              const images = record.images ?? []
              setFileList(images.map((img, idx) => ({
                uid: img.code ?? String(idx),
                name: img.filename ?? 'image',
                status: 'done',
                url: img.url,
                response: img,
              })))

              form.setFieldsValue({
                sku: record.sku,
                size: record.size,
                color: record.color,
                priceModifier: record.priceModifier,
                currentStock: record.currentStock,
                criticalStock: record.criticalStock,
                active: record.active,
              })
              setModalOpen(true)
            }}

          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa biến thể',
                content: `Xóa biến thể SKU: ${record.sku}?`,
                okText: 'Xóa',
                okButtonProps: { danger: true },
                cancelText: 'Hủy',
                async onOk() {
                  try {
                    await deleteVariant(record.id!)
                    messageApi.success('Xóa biến thể thành công')
                    mutate()
                  } catch {
                    messageApi.error('Xóa thất bại')
                  }
                },
              })
            }}
          />
        </Space>
      ),
    },
  ]

  const handleAddNew = () => {
    setEditingVariant(null)
    setFileList([])
    form.resetFields()
    setModalOpen(true)
  }

  const buildSku = (prefix: string, size: string, color: string, index: number) => {
    const colorCode = color
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '')
    const sizeCode = size
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '')
    return `${prefix}-${sizeCode}-${colorCode || index + 1}`
  }

  const matrixPreviewRows = useMemo<MatrixPreviewRow[]>(() => {
    const sizes = matrixSizes ?? []
    const colors = matrixColors ?? []
    const skuPrefix = String(product?.barcode || '').trim()
    if (!skuPrefix || sizes.length === 0 || colors.length === 0) {
      return []
    }

    const existingSkus = new Set((variantData?.data ?? []).map((item) => item.sku?.toUpperCase()))
    const existingComboKeys = new Set(
      (variantData?.data ?? []).map((item) => toCombinationKey(item.size, item.color))
    )
    const rows = sizes.flatMap((size) =>
      colors.map((color, index) => ({
        key: `${size}-${color}-${index}`,
        sku: buildSku(skuPrefix, size, color, index),
        size,
        color,
      }))
    )

    const countBySku = new Map<string, number>()
    rows.forEach((row) => {
      const normalized = row.sku.toUpperCase()
      countBySku.set(normalized, (countBySku.get(normalized) ?? 0) + 1)
    })

    return rows.map((row) => {
      const normalized = row.sku.toUpperCase()
      const duplicateInBatch = (countBySku.get(normalized) ?? 0) > 1
      const duplicateExisting = existingSkus.has(normalized)
      const duplicateComboExisting = existingComboKeys.has(toCombinationKey(row.size, row.color))

      if (duplicateExisting) {
        return { ...row, canCreate: false, reason: 'SKU đã tồn tại' }
      }
      if (duplicateComboExisting) {
        return { ...row, canCreate: false, reason: 'Trùng tổ hợp size/màu' }
      }
      if (duplicateInBatch) {
        return { ...row, canCreate: false, reason: 'Trùng trong ma trận' }
      }
      return { ...row, canCreate: true }
    })
  }, [matrixSizes, matrixColors, product?.barcode, variantData?.data])

  const handleCreateByMatrix = async () => {
    if (!product?.barcode) {
      messageApi.error('Không tìm thấy mã sản phẩm để tạo biến thể.')
      return
    }
    try {
      const values = await matrixForm.validateFields()
      const sizes = (values.sizes as string[]) ?? []
      const colors = (values.colors as string[]) ?? []
      const skuPrefix = String(product.barcode).trim()

      const combinations: Array<{ size: string; color: string }> = []
      sizes.forEach((size) => {
        colors.forEach((color) => {
          combinations.push({ size, color })
        })
      })

      if (combinations.length === 0) {
        messageApi.warning('Vui lòng chọn ít nhất 1 size và 1 màu.')
        return
      }

      const creatableSkus = new Set(
        matrixPreviewRows.filter((row) => row.canCreate).map((row) => row.sku.toUpperCase())
      )
      const payloads = combinations
        .map((combo, index) => {
          const sku = buildSku(skuPrefix, combo.size, combo.color, index)
          if (!creatableSkus.has(sku.toUpperCase())) {
            return null
          }
          return {
            productBarcode: product.barcode,
            sku,
            size: combo.size,
            color: combo.color,
            priceModifier: Number(values.priceModifier ?? 0),
            currentStock: Number(values.currentStock ?? 0),
            criticalStock: Number(values.criticalStock ?? 0),
            active: true,
          } as ProductVariantPojo
        })
        .filter(Boolean) as ProductVariantPojo[]

      if (payloads.length === 0) {
        messageApi.warning('Các SKU sinh ra đã tồn tại, không có biến thể mới để tạo.')
        return
      }

      setMatrixSubmitting(true)
      const results = await Promise.allSettled(payloads.map((payload) => createVariant(payload)))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failCount = results.length - successCount

      if (successCount > 0) {
        messageApi.success(`Đã tạo ${successCount} biến thể từ ma trận.`)
      }
      if (failCount > 0) {
        messageApi.warning(`${failCount} biến thể tạo thất bại, vui lòng kiểm tra dữ liệu SKU/thuộc tính.`)
      }

      if (successCount > 0) {
        setMatrixModalOpen(false)
        matrixForm.resetFields()
        mutate()
      }
    } catch {
      // Validation errors are handled by Form.
    } finally {
      setMatrixSubmitting(false)
    }
  }

  const matrixPreviewColumns: ColumnsType<MatrixPreviewRow> = [
    { title: 'SKU sẽ tạo', dataIndex: 'sku', key: 'sku', width: 220, render: (sku: string) => <Text code>{sku}</Text> },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 90 },
    { title: 'Màu', dataIndex: 'color', key: 'color', width: 120 },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, row: MatrixPreviewRow) =>
        row.canCreate ? <Tag color="green">Tạo mới</Tag> : <Tag color="red">{row.reason}</Tag>,
    },
  ]

  const handleBulkComplete = useCallback(() => {
    setSelectedVariantIds([])
    mutate()
  }, [mutate])

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await uploadImage(file as File)
      onSuccess?.(result)
    } catch (err) {
      onError?.(err as Error)
      messageApi.error('Upload ảnh thất bại')
    }
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }


  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!product?.barcode) {
      messageApi.error('Không tìm thấy mã vạch sản phẩm. Vui lòng tải lại trang.')
      return
    }

    setSubmitting(true)
    try {
      const incomingComboKey = toCombinationKey(values.size as string, values.color as string | undefined)
      const duplicatedCombination = (variantData?.data ?? []).some((item) =>
        item.id !== editingVariant?.id && toCombinationKey(item.size, item.color) === incomingComboKey
      )
      if (duplicatedCombination) {
        messageApi.error('Tổ hợp size/màu đã tồn tại cho sản phẩm này.')
        return
      }

      const existingSkus = (variantData?.data ?? [])
        .filter((item) => item.sku && item.id !== editingVariant?.id)
        .map((item) => String(item.sku))

      const generatedSku = buildAutoVariantSku(
        product.barcode,
        String(values.size ?? ''),
        (values.color as string | undefined) ?? undefined,
        existingSkus
      )

      // Extract images from fileList
      const imagePojos = fileList
        .filter(file => file.status === 'done')
        .map(file => file.response as ImagePojo)

      const payload: ProductVariantPojo = {
        productBarcode: product.barcode,
        sku: editingVariant?.sku ?? generatedSku,
        size: values.size as string,
        color: values.color as string | undefined,
        priceModifier: values.priceModifier as number | undefined,
        currentStock: values.currentStock as number | undefined,
        criticalStock: values.criticalStock as number | undefined,
        active: values.active as boolean | undefined,
        images: imagePojos,
      }


      if (editingVariant) {
        await updateVariant(editingVariant.id!, payload)
        messageApi.success('Cập nhật biến thể thành công')
      } else {
        await createVariant(payload)
        messageApi.success('Tạo biến thể thành công')
      }
      setModalOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <Link href="/products">Sản phẩm</Link> },
            { title: product?.name ?? barcode },
            { title: 'Biến thể' },
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý biến thể
          </Title>
          <Text type="secondary">
            {product?.name ?? 'Đang tải...'} · Barcode: {barcode ?? '...'}
          </Text>

        </div>
      </div>

      <Card
        title="Danh sách biến thể"
        extra={
          <Space>
            {selectedVariantIds.length > 0 && (
              <Button
                onClick={() => setBulkModalOpen(true)}
                style={{ borderColor: '#5856d6', color: '#5856d6' }}
              >
                Thao tác hàng loạt ({selectedVariantIds.length})
              </Button>
            )}
            <Button
              onClick={() => {
                matrixForm.setFieldsValue({
                  sizes: sizeOptions.slice(0, 2),
                  colors: colorOptions.slice(0, 2),
                  priceModifier: 0,
                  currentStock: 0,
                  criticalStock: 0,
                })
                setMatrixModalOpen(true)
              }}
            >
              Tạo theo ma trận
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm biến thể
            </Button>
          </Space>
        }
      >
        <AppTable
          rowKey="id"
          columns={columns}
          dataSource={variantData?.data ?? []}
          loading={isLoading}
          scroll={{ x: 1000 }}
          rowSelection={{
            selectedRowKeys: selectedVariantIds,
            onChange: (keys: React.Key[]) => setSelectedVariantIds(keys),
          }}
          pagination={{
            current: Number(queryParams.pageIndex) + 1 || 1,
            pageSize: Number(queryParams.pageSize) || 20,
            total: variantData?.totalElements ?? 0,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} biến thể`,
            onChange: (page, size) => setTableFetchingParams({ pageIndex: String(page - 1), pageSize: String(size) }),
          }}
        />
      </Card>

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedIds={[]}
        selectedProducts={[]}
        allProductIds={[]}
        selectedVariantIds={selectedVariantIds as number[]}
        productBarcode={barcode}
        categories={[]}
        onBulkComplete={handleBulkComplete}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingVariant ? 'Sửa biến thể' : 'Thêm biến thể mới'}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={editingVariant ? 'Lưu thay đổi' : 'Tạo mới'}
        width={760}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ active: true }}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="Hình ảnh biến thể">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={handleChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>

          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="SKU">
                {editingVariant ? (
                  <Input value={editingVariant.sku} disabled />
                ) : (
                  <Input
                    value={
                      product?.barcode && watchedSize
                        ? buildAutoVariantSku(
                            product.barcode,
                            watchedSize,
                            watchedColor,
                            (variantData?.data ?? []).map((item) => String(item.sku ?? ''))
                          )
                        : 'SKU sẽ tự sinh sau khi chọn size/màu'
                    }
                    disabled
                  />
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Vui lòng chọn size' }]}
              >
                <Select placeholder="Chọn size">
                  {sizeOptions.map((size) => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Select
                  placeholder="Chọn màu"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                >
                  {colorOptions.map((color) => (
                    <Option key={color} value={color}>{color}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceModifier" label="Điều chỉnh giá (VND)">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: +50000 hoặc -10000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) =>
                    Number(value?.replace(/,/g, '') ?? 0) as unknown as string
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
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

          <Form.Item name="active" label="Trạng thái" valuePropName="checked">
            <Button type="default">
              {form.getFieldValue('active') ? 'Hoạt động' : 'Khóa'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo biến thể theo ma trận thuộc tính"
        open={matrixModalOpen}
        onCancel={() => setMatrixModalOpen(false)}
        onOk={handleCreateByMatrix}
        confirmLoading={matrixSubmitting}
        okText="Tạo biến thể"
        cancelText="Hủy"
        width={900}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chọn nhiều size và màu để hệ thống tự tạo tổ hợp biến thể."
          description={`SKU được tự sinh theo mẫu: ${barcode ?? 'PRODUCT'}-SIZE-COLOR`}
        />
        <Form
          form={matrixForm}
          layout="vertical"
          initialValues={{
            sizes: sizeOptions.slice(0, 2),
            colors: colorOptions.slice(0, 2),
            priceModifier: 0,
            currentStock: 0,
            criticalStock: 0,
          }}
        >
          <Form.Item
            name="sizes"
            label="Size (multi-select)"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 size' }]}
          >
            <Select mode="multiple" placeholder="Chọn size">
              {sizeOptions.map((size) => (
                <Option key={size} value={size}>{size}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="colors"
            label="Màu (multi-select)"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 màu' }]}
          >
            <Select mode="tags" placeholder="Chọn màu hoặc nhập mới" tokenSeparators={[',']}>
              {colorOptions.map((color) => (
                <Option key={color} value={color}>{color}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col span={8}>
              <Form.Item name="priceModifier" label="Modifier giá">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentStock" label="Tồn kho">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="criticalStock" label="Ngưỡng">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            type={matrixPreviewRows.some((row) => !row.canCreate) ? 'warning' : 'success'}
            showIcon
            style={{ marginTop: 8, marginBottom: 12 }}
            message={`Preview: ${matrixPreviewRows.length} tổ hợp, ${matrixPreviewRows.filter((row) => row.canCreate).length} có thể tạo.`}
          />

          <Table
            rowKey="key"
            size="small"
            columns={matrixPreviewColumns}
            dataSource={matrixPreviewRows}
            pagination={{ pageSize: 6 }}
            scroll={{ y: 240 }}
          />
        </Form>
      </Modal>
    </>
  )
}

export default VariantManagementView