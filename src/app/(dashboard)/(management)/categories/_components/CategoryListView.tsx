'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Tree, Card, Typography, Row, Col, Button, Input, Modal,
  Form, Select, Space, message, Popconfirm, Spin, Breadcrumb,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  FolderOutlined, FolderOpenOutlined, RightOutlined, DownOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
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

const buildTree = (items: CategoryPojo[]): CategoryPojo[] => {
  const map = new Map<number, CategoryPojo>()
  const roots: CategoryPojo[] = []

  items.forEach((item) => {
    map.set(item.id!, { ...item, children: [] as CategoryPojo[] })
  })

  items.forEach((item) => {
    const node = map.get(item.id!)!
    if (item.parent?.id) {
      const parent = map.get(item.parent.id)
      if (parent) {
        parent.children = parent.children ?? []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

// ── CategoryListView ────────────────────────────────────────────

const CategoryListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<{ page?: number; size?: number }>({
    page: 1,
    size: 100,
  })
  const [searchText, setSearchText] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryPojo | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: CategoryPojo[]
    totalElements: number
  }>(
    [SWR_KEYS.CATEGORY_LIST, queryParams],
    async () => {
      const res = await searchCategories(queryParams)
      return {
        data: res.data ?? [],
        totalElements: res.totalElements ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  // Build flat map for parent selection
  const flatCategories = useMemo(() => {
    const result: CategoryPojo[] = []
    const collect = (items: CategoryPojo[]) => {
      items.forEach((item) => {
        result.push(item)
        if (item.children?.length) collect(item.children)
      })
    }
    if (data?.data) collect(buildTree(data.data))
    return result
  }, [data])

  // Build treeData for Ant Tree
  const treeData = useMemo(() => {
    const filtered = searchText
      ? flatCategories.filter(
          (c) =>
            c.name.toLowerCase().includes(searchText.toLowerCase()) ||
            c.code.toLowerCase().includes(searchText.toLowerCase()),
        )
      : buildTree(data?.data ?? [])

    const toAntTreeNodes = (items: CategoryPojo[]): DataNode[] =>
      items.map((item) => ({
        key: item.id!,
        title: (
          <Space>
            <Text strong={!!item.parent}>{item.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              [{item.code}]
            </Text>
          </Space>
        ),
        children: item.children?.length ? toAntTreeNodes(item.children) : undefined,
        icon: ((props: { expanded?: boolean }) =>
          props.expanded ? <FolderOpenOutlined /> : <FolderOutlined />) as React.ReactNode,
      }))

    return toAntTreeNodes(filtered)
  }, [data?.data, flatCategories, searchText])

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
          ? flatCategories.find((c) => c.id === values.parentId)
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

  // Parent select options (exclude self when editing)
  const parentOptions = flatCategories
    .filter((c) => !editingCategory || c.id !== editingCategory.id)
    .map((c) => ({ label: `${c.name} [${c.code}]`, value: c.id }))

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[{ title: 'Quản lý' }, { title: 'Danh mục sản phẩm' }]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
        <Text type="secondary">
          Quản lý cây danh mục sản phẩm (parent-child)
        </Text>
      </div>

      {/* Filters + Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input.Search
              placeholder="Tìm theo tên hoặc mã..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(v) => setSearchText(v)}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
          </Col>
          <Col xs={24} sm={12} md={14} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRoot}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm danh mục
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tree */}
      <Card bodyStyle={{ padding: 0 }}>
        <Spin spinning={isLoading}>
          {treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              onSelect={(keys) => setSelectedKeys(keys)}
              showIcon
              blockNode
              switcherIcon={({ expanded }) =>
                expanded ? <DownOutlined /> : <RightOutlined />
              }
              titleRender={(nodeData) => {
                const cat = flatCategories.find((c) => c.id === nodeData.key)
                if (!cat) return <span>{nodeData.title as string}</span>
                return (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span style={{ flex: 1 }}>{nodeData.title as string}</span>
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(cat)
                        }}
                      />
                      <Popconfirm
                        title="Xóa danh mục?"
                        description={`Xóa "${cat.name}"?`}
                        okText="Xóa"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(cat.id!)}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                )
              }}
              style={{ padding: '8px 0' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
              {isLoading ? 'Đang tải...' : 'Chưa có danh mục nào'}
            </div>
          )}
        </Spin>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
          >
            <Input placeholder="VD: MAN_SHIRT" disabled={!!editingCategory} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="VD: Áo Sơ Mi" />
          </Form.Item>

          <Form.Item name="parentId" label="Danh mục cha">
            <Select
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
    </>
  )
}

export default CategoryListView
