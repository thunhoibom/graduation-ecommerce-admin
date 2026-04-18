'use client'

import React, { useState, useCallback } from 'react'
import {
  Card, Typography, Row, Col, Button, Input, Select, Space,
  Tag, Popconfirm, Modal, Form, message, Tooltip, Image, Alert,
  Empty,
} from 'antd'
import {
  SearchOutlined, DeleteOutlined, EditOutlined, PlusOutlined,
  EyeOutlined, GridOutlined, TableOutlined, LinkOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchImages,
  createImage,
  updateImage,
  deleteImage,
  type ImagePojo,
  type ImageSearchParams,
} from '@/services/rest-api/app-api/media/media-service'
import AppTable from '@/shared/components/antd/AppTable'

const { Title, Text } = Typography

// ── Helpers ──────────────────────────────────────────────────────

const VIEW_MODES = {
  GRID: 'grid',
  TABLE: 'table',
} as const
type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES]

// ── MediaListView ────────────────────────────────────────────────

const MediaListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<ImageSearchParams>>({
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    order: 'desc',
  })
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID)
  const [formOpen, setFormOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<ImagePojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: ImagePojo[]
    totalElements: number
  }>(
    [SWR_KEYS.MEDIA_LIST, queryParams],
    async () => {
      const res = await searchImages(queryParams as ImageSearchParams)
      return {
        data: res.data ?? [],
        totalElements: res.totalElements ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, page, size }))
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQueryParams((prev) => ({ ...prev, code: value || undefined, page: 1 }))
  }, [])

  const openCreateModal = () => {
    setEditingImage(null)
    form.resetFields()
    setFormOpen(true)
  }

  const openEditModal = (record: ImagePojo) => {
    setEditingImage(record)
    form.setFieldsValue({
      code: record.code,
      filename: record.filename,
      url: record.url,
    })
    setFormOpen(true)
  }

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteImage(id)
      messageApi.success('Xóa hình ảnh thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }, [mutate, messageApi])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const payload: ImagePojo = {
        code: values.code as string,
        filename: values.filename as string,
        url: values.url as string,
      }

      if (editingImage) {
        await updateImage(editingImage.id!, payload)
        messageApi.success('Cập nhật thành công')
      } else {
        await createImage(payload)
        messageApi.success('Tạo hình ảnh thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    messageApi.success('Đã copy URL')
  }

  const columns: ColumnsType<ImagePojo> = [
    {
      title: 'Hình ảnh',
      key: 'preview',
      width: 80,
      render: (_: unknown, record: ImagePojo) => (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            overflow: 'hidden',
            background: '#f5f5f5',
            border: '1px solid #f0f0f0',
          }}
        >
          <img
            src={record.url}
            alt={record.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      ),
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => <Text code>{code}</Text>,
    },
    {
      title: 'Tên file',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (f: string) => f || '—',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Text type="secondary" style={{ fontSize: 12 }}>{url}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ImagePojo) => (
        <Space size={4}>
          <Tooltip title="Copy URL">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => handleCopyUrl(record.url)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa hình ảnh?"
            description={`Xóa "${record.code}"?`}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id!)}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ── Grid render ────────────────────────────────────────────────

  const renderGridItem = (record: ImagePojo) => (
    <Card
      hoverable
      size="small"
      cover={
        <div
          style={{
            height: 140,
            overflow: 'hidden',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={record.url}
            alt={record.filename}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.style.background = '#f0f0f0'
              target.parentElement!.innerHTML = '<div style="color:#999;font-size:11px;text-align:center;padding:8px">Không load được</div>'
            }}
          />
        </div>
      }
      bodyStyle={{ padding: 10 }}
      actions={[
        <Tooltip title="Copy URL" key="copy">
          <Button type="text" size="small" icon={<LinkOutlined />} onClick={() => handleCopyUrl(record.url)} />
        </Tooltip>,
        <Tooltip title="Sửa" key="edit">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="Xóa hình ảnh?"
          description={`Xóa "${record.code}"?`}
          okText="Xóa"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record.id!)}
        >
          <Tooltip title="Xóa">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Text code style={{ fontSize: 11 }}>{record.code}</Text>
        <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
          {record.filename}
        </Text>
      </Space>
    </Card>
  )

  return (
    <>
      {contextHolder}

      {/* Create / Edit Modal */}
      <Modal
        title={editingImage ? 'Chỉnh sửa hình ảnh' : 'Thêm hình ảnh'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingImage ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnClose
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="Mã hình ảnh"
            rules={[{ required: true, message: 'Nhập mã' }]}
          >
            <Input placeholder="VD: hero-banner-01" />
          </Form.Item>

          <Form.Item
            name="filename"
            label="Tên file"
            rules={[{ required: true, message: 'Nhập tên file' }]}
          >
            <Input placeholder="VD: hero-banner-01.jpg" />
          </Form.Item>

          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'Nhập URL' },
              { type: 'url', message: 'URL không hợp lệ' },
            ]}
          >
            <Input placeholder="https://example.com/images/hero.jpg" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Thư viện media</Title>
          <Text type="secondary">Quản lý hình ảnh sản phẩm và nội dung</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
        >
          Thêm hình ảnh
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={14} md={10}>
            <Input.Search
              placeholder="Tìm mã, tên file..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={10} md={14} style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>Hiển thị:</Text>
              <Select
                value={viewMode}
                onChange={(v: ViewMode) => setViewMode(v)}
                style={{ width: 110 }}
                options={[
                  { label: 'Lưới', value: VIEW_MODES.GRID },
                  { label: 'Bảng', value: VIEW_MODES.TABLE },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* No images state */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <Card style={{ marginBottom: 16 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có hình ảnh nào. Thêm hình ảnh đầu tiên."
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Thêm hình ảnh
            </Button>
          </Empty>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === VIEW_MODES.GRID && data?.data && data.data.length > 0 && (
        <Row gutter={[12, 12]}>
          {data.data.map((img) => (
            <Col key={img.id} xs={12} sm={8} md={6} lg={4}>
              {renderGridItem(img)}
            </Col>
          ))}
        </Row>
      )}

      {/* Table View */}
      {viewMode === VIEW_MODES.TABLE && (
        <AppTable
          rowKey="id"
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isLoading}
          scroll={{ x: 700 }}
          pagination={{
            current: queryParams.page ?? 1,
            pageSize: queryParams.size ?? 20,
            total: data?.totalElements ?? 0,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} hình`,
            onChange: handleTableChange,
          }}
        />
      )}
    </>
  )
}

export default MediaListView