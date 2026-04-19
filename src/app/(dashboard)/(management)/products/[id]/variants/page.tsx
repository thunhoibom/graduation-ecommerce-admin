'use client'

import React, { Suspense, useState } from 'react'
import { Typography, Breadcrumb, Card, Table, Tag, Space, Button, Modal, Form, Input, InputNumber, message, Row, Col, Upload, Image as AntdImage } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
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
import { uploadImage } from '@/services/rest-api/app-api/media/media-service'

import AppTable from '@/shared/components/antd/AppTable'
import { useTableFetchingParamsForVariants, DEFAULT_VARIANT_PARAMS, type DefaultVariantParams } from '../../_hooks/use-fetch-variants'

const { Title, Text } = Typography

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
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
            pageIndex: Number(queryParams.page) - 1,
            pageSize: queryParams.size,
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
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      render: (stock: number | undefined, record: ProductVariantPojo) => {
        const critical = record.criticalStock ?? 0
        const color = !stock ? 'red' : stock <= critical ? 'orange' : 'green'
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {stock ?? 0}
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
      // Extract images from fileList
      const imagePojos = fileList
        .filter(file => file.status === 'done')
        .map(file => file.response as ImagePojo)

      const payload: ProductVariantPojo = {
        productBarcode: product.barcode,
        sku: values.sku as string,
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
          >
            Thêm biến thể
          </Button>
        }
      >
        <AppTable
          rowKey="id"
          columns={columns}
          dataSource={variantData?.data ?? []}
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: Number(queryParams.page) || 1,
            pageSize: Number(queryParams.size) || 20,
            total: variantData?.totalElements ?? 0,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} biến thể`,
            onChange: (page, size) => setTableFetchingParams({ page: String(page), size: String(size) }),
          }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingVariant ? 'Sửa biến thể' : 'Thêm biến thể mới'}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={editingVariant ? 'Lưu thay đổi' : 'Tạo mới'}
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
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
              >
                <Input placeholder="VD: SP001-S-MAU1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Vui lòng nhập size' }]}
              >
                <Input placeholder="VD: S, M, L, XL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Input placeholder="VD: Đen, Trắng, Xanh" />
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
    </>
  )
}

export default VariantManagementView