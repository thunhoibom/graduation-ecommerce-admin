'use client'

import React from 'react'
import { Table, Image, Tag, Space, Button, Tooltip, Typography, Dropdown } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SettingOutlined,
  DownOutlined,
} from '@ant-design/icons'
import AppTable from '@/shared/components/antd/AppTable'
import { useRouter } from 'next/navigation'
import { paths } from '@/routes/paths'
import type { ProductPojo } from '../../_types'

const { Text } = Typography

interface DataTableProps {
  data: ProductPojo[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  rowSelection?: TableProps<ProductPojo>['rowSelection']
  onTableChange: (page: number, size: number) => void
  onEdit: (record: ProductPojo) => void
  onView: (record: ProductPojo) => void
  onDelete: (record: ProductPojo) => void
  onChangeStatus?: (record: ProductPojo, status: string) => void
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
  rowSelection,
  onTableChange,
  onEdit,
  onView,
  onDelete,
  onChangeStatus,
}) => {
  const router = useRouter()
  const columns: ColumnsType<ProductPojo> = React.useMemo(
    () => [
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
        width: 120,
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
        key: 'price',
        width: 130,
        align: 'right',
        sorter: true,
        render: (_: unknown, record: ProductPojo) => {
          const display = record.currentPrice ?? record.price
          return (
            <Text style={{ color: '#52c41a', fontWeight: 600 }}>
              {formatVND(display)}
            </Text>
          )
        },
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        align: 'center',
        render: (status: string, record: ProductPojo) => {
          const statusConfig: Record<string, { color: string; label: string }> = {
            DRAFT: { color: 'default', label: 'Bản nháp' },
            PUBLISHED: { color: 'success', label: 'Đang bán' },
            UNLISTED: { color: 'orange', label: 'Ngừng bán' },
          }
          const config = statusConfig[status] || statusConfig.DRAFT

          const items = [
            { key: 'DRAFT', label: 'Bản nháp' },
            { key: 'PUBLISHED', label: 'Đang bán' },
            { key: 'UNLISTED', label: 'Ngừng bán' },
          ]

          return (
            <Dropdown
              menu={{
                items,
                onClick: ({ key }) => onChangeStatus?.(record, key),
              }}
              trigger={['click']}
            >
              <Tag
                color={config.color}
                style={{ cursor: 'pointer', fontWeight: 600, margin: 0 }}
              >
                {config.label} <DownOutlined style={{ fontSize: 10 }} />
              </Tag>
            </Dropdown>
          )
        },
      },
      {
        title: 'Tồn kho',
        key: 'stock',
        width: 110,
        align: 'right',
        render: (_: unknown, record: ProductPojo) => {
          const cur = record.currentStock ?? 0
          const res = record.reservedStock ?? 0
          return (
            <Tooltip title={`Thực tế: ${cur} · Đang giữ: ${res} · Khả dụng: ${record.availableStock ?? cur - res}`}>
              <Space orientation="vertical" size={0}>
                <Text strong>{cur}</Text>
                {res > 0 ? (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    giữ {res}
                  </Text>
                ) : null}
              </Space>
            </Tooltip>
          )
        },
      },
      {
        title: 'Khả dụng',
        dataIndex: 'availableStock',
        key: 'availableStock',
        width: 100,
        align: 'right',
        render: (available: number | undefined, record: ProductPojo) => {
          const critical = record.criticalStock ?? 5
          const color = !available ? '#ff4d4f' : available <= critical ? '#fa8c16' : '#52c41a'
          return (
            <Tag color={color} style={{ fontWeight: 600, margin: 0 }}>
              {available ?? 0}
            </Tag>
          )
        },
      },
      {
        title: 'Đánh giá',
        dataIndex: 'averageRating',
        key: 'averageRating',
        width: 100,
        align: 'center',
        render: (rating: number | undefined, record: ProductPojo) => {
          if (!rating) return <Text type="secondary">—</Text>
          const reviews = record.totalReviews
          return (
            <Space size={4} orientation="vertical" style={{ alignItems: 'center' }}>
              <Space size={4}>
                <span style={{ color: '#faad14' }}>★</span>
                <Text>{rating.toFixed(1)}</Text>
              </Space>
              {reviews != null && reviews > 0 ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {reviews} lượt
                </Text>
              ) : null}
            </Space>
          )
        },
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        fixed: 'right',
        render: (_: unknown, record: ProductPojo) => (
          <Space size={0}>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
            <Tooltip title="Quản lý biến thể">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => router.push(paths.products.variants(String(record.id)))}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onDelete, onEdit, onView, onChangeStatus, router]
  )

  return (
    <AppTable
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 1180 }}
      rowSelection={rowSelection}
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
