'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Table, Tag, Button, Space,
  Spin, Breadcrumb, Row, Col, Statistic, message, Image, Alert,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  ShoppingOutlined, StarOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getProductById,
  deleteProduct,
  searchVariants,
  type ProductPojo,
  type ProductVariantPojo,
  type PageResponse as VariantPageResponse,
} from '@/services/rest-api/app-api/products/product-service'

const { Title, Text } = Typography

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

interface ProductDetailPageProps {
  productId: string
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId }) => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: product, isLoading, mutate } = useAxiosSWR<ProductPojo>(
    [SWR_KEYS.PRODUCT_DETAIL, productId],
    async () => getProductById(Number(productId)),
    { revalidateOnMount: true },
  )

  const { data: variantsData } = useAxiosSWR<any>(
    product?.barcode ? ['product-variants', product.barcode] : null,
    product?.barcode
      ? async () => searchVariants({ productBarcode: product.barcode, pageSize: 100 })
      : null,
    { revalidateOnMount: true },
  )


  // Safe way to get items from variantsData (handling both 'items' and 'data' structures)
  const variants = variantsData?.items ?? variantsData?.data ?? []

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Đang tải thông tin sản phẩm...">
          <div style={{ padding: 50 }} />
        </Spin>
      </div>
    )
  }


  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Card>
          <Text type="secondary">Không tìm thấy sản phẩm hoặc có lỗi xảy ra.</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => router.push('/products/list')}>Quay lại danh sách</Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deleteProduct(Number(productId))
      messageApi.success('Xóa sản phẩm thành công')
      router.push('/products/list')
    } catch {
      messageApi.error('Xóa sản phẩm thất bại')
    }
  }

  const variantColumns: ColumnsType<ProductVariantPojo> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (s: string) => s ? <Text code style={{ fontSize: 12 }}>{s}</Text> : '—',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
      align: 'center' as const,
      render: (s: string) => s || '—',
    },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (c: string) => c || '—',
    },
    {
      title: 'Giá',
      key: 'price',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Text strong>{formatVND(record.finalPrice ?? (product.price + (record.priceModifier ?? 0)))}</Text>
      ),
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariantPojo) => {
        const stock = record.currentStock ?? 0
        const color = stock === 0 ? '#ff4d4f' : stock < (record.criticalStock ?? 5) ? '#fa8c16' : '#52c41a'
        return <Tag color={stock === 0 ? 'red' : stock < (record.criticalStock ?? 5) ? 'orange' : 'green'}>{stock}</Tag>
      },
    },
    {
      title: 'Còn trống',
      key: 'available',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Text type="secondary">{record.availableStock ?? record.currentStock ?? 0}</Text>
      ),
    },
    {
      title: 'Đã đặt',
      key: 'reserved',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Tag color="blue">{record.reservedStock ?? 0}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'active',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariantPojo) => (
        <Tag color={record.active !== false ? 'green' : 'default'}>
          {record.active !== false ? 'Hoạt động' : 'Tắt'}
        </Tag>
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
            { title: <a onClick={() => router.push('/products/list')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/products/list')}>Sản phẩm</a> },
            { title: product.name },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/products/list')}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>{product.name}</Title>
          {product.category?.name && (
            <Tag color="purple">{product.category.name}</Tag>
          )}
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Left column ── */}
        <Col xs={24} lg={16}>

          {/* Basic info */}
          <Card title="Thông tin sản phẩm" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Barcode" span={2}>
                <Text copyable style={{ fontFamily: 'monospace' }}>{product.barcode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Giá bán">
                <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                  {formatVND(product.price)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tồn kho">
                <Tag color={product.currentStock === 0 ? 'red' : (product.currentStock ?? 0) < (product.criticalStock ?? 5) ? 'orange' : 'green'}>
                  {product.currentStock ?? 0}
                </Tag>
                {product.criticalStock && (
                  <Text type="secondary" style={{ fontSize: 12 }}> (ngưỡng: {product.criticalStock})</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                {product.category?.name ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá">
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text>{product.averageRating?.toFixed(1) ?? '—'}</Text>
                  {product.totalReviews && (
                    <Text type="secondary">({product.totalReviews} đánh giá)</Text>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Description */}
          {product.description && (
            <Card title="Mô tả sản phẩm" style={{ marginBottom: 16 }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{product.description}</Text>
            </Card>
          )}

          {/* Variants */}
          <Card
            title={`Biến thể (${variants.length})`}
            extra={
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => router.push(`/products/${productId}/variants`)}
              >
                Quản lý biến thể
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            {variants.length === 0 ? (
              <Alert
                type="info"
                message="Sản phẩm chưa có biến thể nào."
                showIcon
              />
            ) : (
              <Table
                dataSource={variants}
                rowKey="id"
                columns={variantColumns}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
            )}
          </Card>

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <Card title="Hình ảnh sản phẩm">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Image.PreviewGroup>
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <Image
                        src={img.url ?? ''}
                        alt={img.altText ?? product.name}
                        width={120}
                        height={120}
                        style={{ objectFit: 'cover' }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                      />
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            </Card>
          )}


        </Col>

        {/* ── Right column ── */}
        <Col xs={24} lg={8}>

          {/* Quick stats */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Statistic
                  title="Giá bán"
                  value={product.price}
                  formatter={(v) => <Text style={{ color: '#52c41a' }}>{formatVND(Number(v))}</Text>}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tồn kho"
                  value={product.currentStock ?? 0}
                  styles={{ content: { color: (product.currentStock ?? 0) === 0 ? '#ff4d4f' : '#5856d6' } }}
                />
              </Col>
            </Row>

            {(product.currentStock ?? 0) < (product.criticalStock ?? 5) && (
              <Alert
                type="warning"
                message="Cảnh báo tồn kho thấp"
                description={`Tồn kho hiện tại (${product.currentStock ?? 0}) thấp hơn ngưỡng cảnh báo (${product.criticalStock ?? 5}).`}
                icon={<ExclamationCircleOutlined />}
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </Card>

          {/* Actions */}
          <Card title="Thao tác" style={{ marginBottom: 16 }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                onClick={() => router.push(`/products/${productId}`)}
                style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
              >
                Chỉnh sửa sản phẩm
              </Button>
              <Button
                icon={<EditOutlined />}
                block
                onClick={() => router.push(`/products/${productId}/variants`)}
              >
                Quản lý biến thể
              </Button>
              <Divider style={{ margin: '8px 0' }} />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                block
                onClick={handleDelete}
              >
                Xóa sản phẩm
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ProductDetailPage
