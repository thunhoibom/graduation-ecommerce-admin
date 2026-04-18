'use client'

import React from 'react'
import { Drawer, Descriptions, Image, Tag, Spin, Space, Typography, Divider } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import type { ProductPojo } from '../../_types'

const { Text, Paragraph } = Typography

interface ProductDetailDrawerProps {
  open: boolean
  product: ProductPojo | null
  loading?: boolean
  onClose: () => void
  onEdit: () => void
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  open,
  product,
  loading,
  onClose,
  onEdit,
}) => {
  if (!product) return null

  const images = product.images ?? []
  const hasImages = images.length > 0

  return (
    <Drawer
      title={
        <Space>
          <span>Chi tiết sản phẩm</span>
        </Space>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      extra={
        <Tag color="purple" style={{ cursor: 'pointer' }} onClick={onEdit}>
          <EditOutlined /> Sửa
        </Tag>
      }
    >
      <Spin spinning={loading}>
        {/* Images */}
        {hasImages ? (
          <Image.PreviewGroup>
            <Space size={8} style={{ marginBottom: 16 }}>
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  src={img.url}
                  alt={img.altText ?? `image-${idx}`}
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <div
            style={{
              width: '100%',
              height: 160,
              background: '#f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text type="secondary">Không có hình ảnh</Text>
          </div>
        )}

        {/* Basic Info */}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Barcode">
            <Text code>{product.barcode}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tên sản phẩm">
            <Text strong>{product.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục">
            {product.category ? (
              <Tag color="blue">{product.category.name}</Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Giá bán">
            <Text style={{ color: '#52c41a', fontWeight: 600 }}>
              {formatVND(product.price)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tồn kho">
            <Tag
              color={
                !product.currentStock
                  ? 'red'
                  : (product.currentStock ?? 0) <= (product.criticalStock ?? 0)
                  ? 'orange'
                  : 'green'
              }
            >
              {product.currentStock ?? 0}
            </Tag>
            {product.criticalStock != null && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                (ngưỡng: {product.criticalStock})
              </Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Đánh giá">
            {product.averageRating ? (
              <Space size={4}>
                <span style={{ color: '#faad14' }}>★</span>
                <Text>{product.averageRating.toFixed(1)}</Text>
                <Text type="secondary">({product.totalReviews ?? 0} đánh giá)</Text>
              </Space>
            ) : (
              <Text type="secondary">Chưa có đánh giá</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Description */}
        {(product.description || product.description !== '') && (
          <>
            <Divider orientation="left">Mô tả</Divider>
            <Paragraph style={{ color: '#595959' }}>
              {product.description || 'Không có mô tả'}
            </Paragraph>
          </>
        )}
      </Spin>
    </Drawer>
  )
}

export default ProductDetailDrawer
