'use client'

import React from 'react'
import { Table, Image, Tag, Space, Button, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import AppTable from '@/shared/components/antd/AppTable'
import type { ProductPojo } from '../../_types'

const { Text } = Typography

interface DataTableProps {
  data: ProductPojo[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  onTableChange: (page: number, size: number) => void
  onEdit: (record: ProductPojo) => void
  onView: (record: ProductPojo) => void
  onDelete: (record: ProductPojo) => void
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  total,
  current,
  pageSize,
  onTableChange,
  onEdit,
  onView,
  onDelete,
}) => {
  const columns: ColumnsType<ProductPojo> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: ProductPojo['images']) => {
        const url = images?.[0]?.url
        return url ? (
          <Image
            src={url}
            alt="product"
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: '#f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}
          >
            No img
          </div>
        )
      },
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (barcode: string) => (
        <Text code style={{ fontSize: 12 }}>
          {barcode}
        </Text>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: ProductPojo) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {name}
          </Text>
          {record.category && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.category.name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      align: 'right',
      sorter: true,
      render: (price: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 600 }}>
          {formatVND(price)}
        </Text>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      sorter: true,
      render: (stock: number | undefined, record: ProductPojo) => {
        const critical = record.criticalStock ?? 0
        const color = !stock ? '#ff4d4f' : stock <= critical ? '#fa8c16' : '#52c41a'
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {stock ?? 0}
          </Tag>
        )
      },
    },
    {
      title: 'Đánh giá',
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 120,
      align: 'center',
      render: (rating: number | undefined, record: ProductPojo) => {
        if (!rating) return <Text type="secondary">—</Text>
        return (
          <Space size={4}>
            <span style={{ color: '#faad14' }}>★</span>
            <Text>{rating.toFixed(1)}</Text>
            <Text type="secondary">({record.totalReviews ?? 0})</Text>
          </Space>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      fixed: 'right',
      render: (_: unknown, record: ProductPojo) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <AppTable
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 900 }}
      pagination={{
        current,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} sản phẩm`,
        onChange: onTableChange,
      }}
    />
  )
}

export default DataTable
