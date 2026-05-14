'use client'

import React, { useMemo, useState } from 'react'
import {
  Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  createBlogPost, deleteBlogPost, patchBlogPost, searchBlogPosts, type BlogPostPojo, type BlogStatus, updateBlogPost,
} from '@/services/rest-api/app-api/blog/blog-service'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import QuillEditor from '@/shared/components/QuillEditor'

const { Title, Text } = Typography
const statusOptions: BlogStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

const statusColor: Record<BlogStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'green',
  ARCHIVED: 'orange',
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const nowLocalDateTimeSeconds = () => {
  const date = new Date()
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

const toInputDateTime = (value?: string) => {
  if (!value) return undefined
  return value.replace(' ', 'T').slice(0, 16)
}

const normalizePublishedAtForApi = (value?: string) => {
  if (!value) return undefined
  const normalized = value.replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`
  }
  return normalized
}

export default function BlogListView() {
  const [msg, ctx] = message.useMessage()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<BlogStatus | undefined>(undefined)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<BlogPostPojo | null>(null)
  const [form] = Form.useForm<BlogPostPojo>()

  const fetchKey = useMemo(() => ['blog/list', query, status, pageIndex, pageSize], [query, status, pageIndex, pageSize])
  const { data, isLoading, mutate } = useAxiosSWR(fetchKey, () =>
    searchBlogPosts({
      title: query || undefined,
      status,
      pageIndex,
      pageSize,
      sortBy: 'publishedAt',
      order: 'desc',
    }), { revalidateOnMount: true })

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'DRAFT' })
    setOpen(true)
  }

  const onEdit = (post: BlogPostPojo) => {
    setEditing(post)
    form.setFieldsValue({
      ...post,
      publishedAt: toInputDateTime(post.publishedAt),
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload: BlogPostPojo = { ...values }
      payload.publishedAt = normalizePublishedAtForApi(payload.publishedAt)

      if (payload.status === 'PUBLISHED' && !payload.publishedAt) {
        payload.publishedAt = nowLocalDateTimeSeconds()
      }

      setSaving(true)
      if (editing?.id) {
        await updateBlogPost(editing.id, payload)
        msg.success('Cập nhật bài viết thành công')
      } else {
        await createBlogPost(payload)
        msg.success('Tạo bài viết thành công')
      }
      setOpen(false)
      mutate()
    } catch {
      msg.error('Không thể lưu bài viết')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<BlogPostPojo> = [
    { title: 'ID', dataIndex: 'id', width: 80, render: (v: number) => <Text code>#{v}</Text> },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    { title: 'Slug', dataIndex: 'slug', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (v: BlogStatus, r) => (
        <Space>
          <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>
          {v !== 'PUBLISHED' && r.id && (
            <Button size="small" onClick={async () => { await patchBlogPost(r.id!, { status: 'PUBLISHED' }); mutate() }}>
              Publish
            </Button>
          )}
        </Space>
      ),
    },
    { title: 'Tác giả', dataIndex: 'authorName', width: 160, render: (v?: string) => v ?? '—' },
    { title: 'Xuất bản', dataIndex: 'publishedAt', width: 180, render: (v?: string) => v ?? '—' },
    {
      title: 'Thao tác',
      width: 180,
      render: (_: unknown, r) => (
        <Space>
          <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
          <Popconfirm title="Xóa bài viết này?" onConfirm={async () => { if (r.id) { await deleteBlogPost(r.id); mutate() } }}>
            <Button danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      {ctx}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Blog</Title>
        <Text type="secondary">CRUD, publish và tìm kiếm bài viết</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm theo tiêu đề"
            onSearch={(v) => { setQuery(v.trim()); setPageIndex(0) }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={status}
            onChange={(v) => { setStatus(v); setPageIndex(0) }}
            options={statusOptions.map((s) => ({ label: s, value: s }))}
          />
          <Button type="primary" onClick={onCreate}>Tạo bài viết</Button>
        </Space>
      </Card>

      <Table
        rowKey={(r) => String(r.id)}
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{
          current: pageIndex + 1,
          pageSize,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (page, size) => { setPageIndex(page - 1); setPageSize(size) },
        }}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={saving}
        width={860}
        title={editing?.id ? 'Cập nhật bài viết' : 'Tạo bài viết'}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'DRAFT' }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="Tự sinh theo tiêu đề nếu để trống" />
          </Form.Item>
          <Form.Item name="summary" label="Mô tả ngắn">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="thumbnailUrl" label="Thumbnail URL (Media)">
            <Input placeholder="Dán URL ảnh từ media library" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={statusOptions.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="publishedAt" label="Thời điểm xuất bản">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="content" label="Nội dung" rules={[{ required: true }]}>
            <QuillEditor />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
