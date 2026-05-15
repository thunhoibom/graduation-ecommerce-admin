'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Typography, Button, Input, Modal,
  Form, Select, Space, message, Popconfirm, Tag, Tooltip, theme, Upload, InputNumber
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  FolderOutlined, NodeIndexOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { uploadImage } from '@/services/rest-api/app-api/media/media-service'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  createCategory,
  updateCategory,
  patchCategory,
  deleteCategory,
  type CategoryPojo,
  type ImagePojo,
} from '@/services/rest-api/app-api/categories/category-service'
import AppTable from '@/shared/components/antd/AppTable'
import {
  ListFilterActions,
  ListFilterCard,
  ListFilterCol,
  ListFilterField,
  ListFilterGrid,
  LIST_FILTER_SEARCH_FLEX,
} from '@/shared/components/list-filter'

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

const compareByDisplayOrder = (a: CategoryPojo, b: CategoryPojo) => {
  const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  if (orderDiff !== 0) return orderDiff
  return a.name.localeCompare(b.name, 'vi')
}

const sortTreeNodes = (nodes: CategoryPojo[]): CategoryPojo[] =>
  [...nodes]
    .sort(compareByDisplayOrder)
    .map((node) => ({
      ...node,
      children: node.children ? sortTreeNodes(node.children) : undefined,
    }))

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

  return sortTreeNodes(roots)
}

// ── CategoryListView ────────────────────────────────────────────

const CategoryListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const { token } = theme.useToken()
  const [queryParams, setQueryParams] = useState<{
    pageIndex?: number
    pageSize?: number
    sortBy?: string
    order?: 'asc' | 'desc'
  }>({
    pageIndex: 0,
    pageSize: 200,
    sortBy: 'displayOrder',
    order: 'asc',
  })
  const [searchText, setSearchText] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryPojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

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
      ).sort(compareByDisplayOrder).map(c => ({ ...c, children: undefined })) // Flat view when searching
    }

    return tree
  }, [flatCategories, searchText])

  const handleSearch = useCallback((value: string) => {
    setSearchText(value.trim())
  }, [])

  const handleAddRoot = () => {
    setEditingCategory(null)
    setFileList([])
    form.resetFields()
    setFormOpen(true)
  }

  const handleEdit = (record: CategoryPojo) => {
    setEditingCategory(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      parentId: record.parent?.id,
      displayOrder: record.displayOrder ?? 0,
    })

    if (record.image) {
      setFileList([{
        uid: record.image.code ?? '-1',
        name: record.image.filename ?? 'image.png',
        status: 'done',
        url: record.image.url,
        response: record.image
      }])
    } else {
      setFileList([])
    }

    setFormOpen(true)
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

  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
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

  const getSiblings = useCallback((record: CategoryPojo) => {
    const parentId = record.parent?.id ?? null
    return flatCategories
      .filter((category) => (category.parent?.id ?? null) === parentId)
      .sort(compareByDisplayOrder)
  }, [flatCategories])

  const handleMove = useCallback(async (record: CategoryPojo, direction: 'up' | 'down') => {
    const siblings = getSiblings(record)
    const currentIndex = siblings.findIndex((item) => item.id === record.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return
    }

    const current = siblings[currentIndex]
    const target = siblings[targetIndex]
    const currentOrder = current.displayOrder ?? currentIndex
    const targetOrder = target.displayOrder ?? targetIndex

    try {
      await Promise.all([
        patchCategory(current.id!, { displayOrder: targetOrder }),
        patchCategory(target.id!, { displayOrder: currentOrder }),
      ])
      messageApi.success('Đã cập nhật thứ tự hiển thị')
      mutate()
    } catch {
      messageApi.error('Không thể cập nhật thứ tự hiển thị')
    }
  }, [getSiblings, messageApi, mutate])

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const uploadedImage = fileList[0]?.response as ImagePojo | undefined

      const payload: CategoryPojo = {
        code: values.code as string,
        name: values.name as string,
        displayOrder: typeof values.displayOrder === 'number' ? values.displayOrder : 0,
        image: uploadedImage,
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
          {record.image?.url ? (
            <img 
              src={record.image.url} 
              alt={text} 
              style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} 
            />
          ) : (
            <FolderOutlined style={{ color: token.colorPrimary }} />
          )}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Mã danh mục',
      dataIndex: 'code',
      key: 'code',
      width: '30%',
      render: (code) => (
        <Tag color="blue">
          <NodeIndexOutlined style={{ marginRight: 4 }} />
          {code}
        </Tag>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 90,
      align: 'center',
      render: (value: number | undefined) => (
        <Tag color="default">{value ?? 0}</Tag>
      ),
    },
    {
      title: 'Cấp bậc',
      key: 'level',
      width: '20%',
      render: (_, record) => {
        return record.parent ? (
          <Tag color="cyan">Danh mục con</Tag>
        ) : (
          <Tag color="volcano">Danh mục gốc</Tag>
        )
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, record) => {
        const siblings = getSiblings(record)
        const currentIndex = siblings.findIndex((item) => item.id === record.id)
        const canMoveUp = currentIndex > 0
        const canMoveDown = currentIndex >= 0 && currentIndex < siblings.length - 1

        return (
        <Space size="middle" onClick={e => e.stopPropagation()}>
          <Tooltip title="Lên trên">
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={!canMoveUp}
              onClick={() => handleMove(record, 'up')}
            />
          </Tooltip>
          <Tooltip title="Xuống dưới">
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={!canMoveDown}
              onClick={() => handleMove(record, 'down')}
            />
          </Tooltip>
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
        )
      },
    },
  ]

  return (
    <>
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
        <Text type="secondary">Phân loại và tổ chức sản phẩm theo cấu trúc cây</Text>
      </div>

      <ListFilterCard>
        <ListFilterGrid>
          <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
            <ListFilterField label="Từ khóa">
              <Input.Search
                placeholder="Tìm theo tên hoặc mã danh mục..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => !e.target.value && setSearchText('')}
              />
            </ListFilterField>
          </ListFilterCol>
          <ListFilterActions>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoot}>
              Thêm danh mục
            </Button>
          </ListFilterActions>
        </ListFilterGrid>
      </ListFilterCard>

      <AppTable
        columns={columns}
        dataSource={treeData}
        rowKey={(record) => String(record.id ?? record.code)}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 900 }}
        expandable={{
          defaultExpandAllRows: true,
        }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        destroyOnHidden
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập mã danh mục!' }]}
          >
            <Input
              placeholder="VD: MENSWEAR, SHIRTS..."
              disabled={!!editingCategory}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="VD: Trang phục nam" />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Thứ tự hiển thị"
            tooltip="Số nhỏ hơn sẽ hiển thị trước trong cùng nhóm danh mục cha"
          >
            <InputNumber min={0} className="w-full" />
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

          <Form.Item label="Hình ảnh danh mục">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={handleFileChange}
              maxCount={1}
            >
              {fileList.length < 1 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default CategoryListView

