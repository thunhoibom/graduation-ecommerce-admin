'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Table, Card, Typography, Row, Col, Button, Input, Modal,
  Form, Select, Space, message, Popconfirm, Breadcrumb, Tag, Tooltip, theme
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  FolderOutlined, NodeIndexOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryPojo,
} from '@/services/rest-api/app-api/categories/category-service'

const { Title, Text } = Typography

// ── Helpers ──────────────────────────────────────────────────────

// Extract all categories into a flat list in case backend returns nested tree
const flattenCategories = (items: CategoryPojo[]): CategoryPojo[] => {
  const result: CategoryPojo[] = []
  const dfs = (nodes: CategoryPojo[]) => {
    for (const node of nodes) {
      const copy = { ...node }
      delete copy.children // Will rebuild later
      result.push(copy)
      if (node.children && node.children.length > 0) {
        dfs(node.children)
      }
    }
  }
  dfs(items)
  return result
}

// Rebuild correctly mapped tree for Ant Design Table
const buildTree = (flatItems: CategoryPojo[]): CategoryPojo[] => {
  const map = new Map<number | string, CategoryPojo>()
  const roots: CategoryPojo[] = []

  flatItems.forEach((item) => {
    map.set(item.id ?? item.code, { ...item, children: [] })
  })

  flatItems.forEach((item) => {
    const node = map.get(item.id ?? item.code)!
    if (item.parent) {
      const parentKey = item.parent.id ?? item.parent.code
      const parentNode = map.get(parentKey)
      if (parentNode) {
        parentNode.children = parentNode.children ?? []
        parentNode.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  const cleanup = (nodes: CategoryPojo[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length === 0) {
        delete node.children
      } else if (node.children) {
        cleanup(node.children)
      }
    })
  }
  cleanup(roots)
  
  return roots
}

// ── CategoryListView ────────────────────────────────────────────

const CategoryListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const { token } = theme.useToken()
  const [queryParams, setQueryParams] = useState<{ page?: number; size?: number }>({
    page: 1,
    size: 200,
  })
  const [searchText, setSearchText] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryPojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: CategoryPojo[]
    totalCount: number
  }>(
    [SWR_KEYS.CATEGORY_LIST, queryParams],
    async () => {
      const res = await searchCategories(queryParams)
      return {
        data: res.items ?? [],
        totalCount: res.totalCount ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const flatCategories = useMemo(() => {
    if (!data?.data) return []
    return flattenCategories(data.data)
  }, [data?.data])

  const treeData = useMemo(() => {
    const tree = buildTree(flatCategories)
    
    // Simple filter that preserves tree visually by highlighting or filtering out
    // If there is searchText, filter the flat list and don't render as tree to avoid confusion
    if (searchText) {
      const term = searchText.toLowerCase()
      return flatCategories.filter(
        c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
      ).map(c => ({ ...c, children: undefined })) // Flat view when searching
    }
    
    return tree
  }, [flatCategories, searchText])

  const handleAddRoot = () => {
    setEditingCategory(null)
    form.resetFields()
    setFormOpen(true)
  }

  const handleEdit = (record: CategoryPojo) => {
    setEditingCategory(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      parentId: record.parent?.id,
    })
    setFormOpen(true)
  }

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteCategory(id)
      messageApi.success('Xóa danh mục thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }, [mutate, messageApi])

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: CategoryPojo = {
        code: values.code as string,
        name: values.name as string,
        parent: values.parentId
          ? flatCategories.find((c) => (c.id ?? c.code) === values.parentId)
          : undefined,
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id!, payload)
        messageApi.success('Cập nhật danh mục thành công')
      } else {
        await createCategory(payload)
        messageApi.success('Tạo danh mục thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const parentOptions = flatCategories
    .filter((c) => !editingCategory || (c.id ?? c.code) !== (editingCategory.id ?? editingCategory.code))
    .map((c) => ({ label: `${c.name} [${c.code}]`, value: c.id ?? c.code }))

  const columns: ColumnsType<CategoryPojo> = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FolderOutlined style={{ color: token.colorPrimary }} />
          <Text strong style={{ fontSize: 15 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Mã danh mục',
      dataIndex: 'code',
      key: 'code',
      width: '30%',
      render: (code) => (
        <Tag color="blue" bordered={false} style={{ padding: '4px 8px', borderRadius: 6 }}>
          <NodeIndexOutlined style={{ marginRight: 4 }} />
          {code}
        </Tag>
      ),
    },
    {
      title: 'Cấp bậc',
      key: 'level',
      width: '20%',
      render: (_, record) => {
        return record.parent ? (
          <Tag color="cyan" bordered={false}>
            Danh mục con
          </Tag>
        ) : (
          <Tag color="volcano" bordered={false}>
            Root
          </Tag>
        )
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '15%',
      align: 'right',
      render: (_, record) => (
        <Space size="middle" onClick={e => e.stopPropagation()}>
          <Tooltip title="Sửa danh mục">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: token.colorPrimary }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa danh mục này?"
            description="Bạn có chắc chắn muốn xóa không?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {contextHolder}

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Breadcrumb
            items={[{ title: 'Quản lý' }, { title: 'Danh mục sản phẩm' }]}
            style={{ marginBottom: 8 }}
          />
          <Title level={3} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
          <Text type="secondary">
            Phân loại và tổ chức sản phẩm một cách hệ thống
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRoot}
            size="large"
            style={{ borderRadius: 8, padding: '0 24px', boxShadow: '0 4px 12px rgba(88,86,214,0.3)' }}
          >
            Thêm danh mục
          </Button>
        </Col>
      </Row>

      <Card
        variant="borderless"
        styles={{ body: { padding: '20px' } }}
        style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Input.Search
          placeholder="Tìm kiếm danh mục theo tên hoặc mã..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={(v) => setSearchText(v)}
          onChange={(e) => !e.target.value && setSearchText('')}
          style={{ maxWidth: 600 }}
        />
      </Card>

      <Card 
        styles={{ body: { padding: 0 } }} 
        variant="borderless" 
        style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      >
          <Table
          columns={columns}
          dataSource={treeData}
          rowKey={(record) => record.id ?? record.code}
          loading={isLoading}
          pagination={false}
          expandable={{
            defaultExpandAllRows: true, // Auto expand so it feels like a fully populated list
          }}
          rowClassName={() => 'category-row'}
          onRow={(record) => ({
             style: { cursor: 'pointer' },
             onClick: () => handleEdit(record)
          })}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingCategory ? <EditOutlined style={{ color: token.colorPrimary }} /> : <PlusOutlined style={{ color: token.colorPrimary }} />}
            <span style={{ fontSize: 18 }}>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</span>
          </Space>
        }
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnHidden
        centered
        width={500}
        styles={{ body: { paddingTop: 20 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="code"
            label={<Text strong>Mã danh mục</Text>}
            rules={[{ required: true, message: 'Vui lòng nhập mã danh mục!' }]}
          >
            <Input 
              size="large" 
              placeholder="VD: MENSWEAR, SHIRTS..." 
              disabled={!!editingCategory} 
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={<Text strong>Tên danh mục</Text>}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input size="large" placeholder="VD: Trang phục nam" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="parentId" label={<Text strong>Danh mục cha</Text>}>
            <Select
              size="large"
              placeholder="— Không có (danh mục gốc) —"
              allowClear
              options={parentOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <style>{`
        .category-row:hover > td {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  )
}

export default CategoryListView

