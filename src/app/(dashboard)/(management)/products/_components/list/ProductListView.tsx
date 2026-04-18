'use client'

import React, { useState, useCallback } from 'react'
import { Modal, message, Typography, Space } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  deleteProduct,
  createProduct,
  updateProduct,
  type ProductPojo,
  type ProductCategoryPojo,
} from '@/services/rest-api/app-api/products/product-service'
import { PageResponse } from '@/types/common'
import FilterToolbar from '../toolbar/FilterToolbar'
import DataTable from '../table/DataTable'
import ProductFormModal from '../form/ProductFormModal'
import ProductDetailDrawer from '../detail/ProductDetailDrawer'
import { useFetchProducts } from '../../_hooks/use-fetch-products'

const { Title, Text } = Typography

const ProductListView: React.FC = () => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()

  const {
    tableData,
    isLoading,
    queryParams,
    setTableFetchingParams,
    mutate,
  } = useFetchProducts()

  // Categories
  const { data: categoryData } = useAxiosSWR<PageResponse<ProductCategoryPojo[]>>(
    [SWR_KEYS.CATEGORY_LIST, { page: 1, size: 100 }],
    async () => searchCategories({ page: 1, size: 100 }),
    { revalidateOnMount: true },
  )
  const categories = categoryData?.data ?? []

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductPojo | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductPojo | null>(null)

  // ── Handlers ────────────────────────────────────────────────

  const handleTableChange = useCallback(
    (page: number, size: number) => {
      setTableFetchingParams({ page: String(page), size: String(size) })
    },
    [setTableFetchingParams],
  )

  const handleAddNew = useCallback(() => {
    setEditingProduct(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback(
    (record: ProductPojo) => {
      setEditingProduct(record)
      setFormOpen(true)
    },
    [],
  )

  const handleView = useCallback((record: ProductPojo) => {
    setSelectedProduct(record)
    setDetailOpen(true)
  }, [])

  const handleDetailEdit = useCallback(() => {
    if (selectedProduct) {
      setDetailOpen(false)
      setEditingProduct(selectedProduct)
      setFormOpen(true)
    }
  }, [selectedProduct])

  const handleDelete = useCallback(
    (record: ProductPojo) => {
      Modal.confirm({
        title: 'Xác nhận xóa sản phẩm',
        icon: <ExclamationCircleOutlined />,
        content: (
          <Space direction="vertical" size={4}>
            <Text>Bạn có chắc muốn xóa sản phẩm này?</Text>
            <Text type="secondary">{record.name}</Text>
          </Space>
        ),
        okText: 'Xóa',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        async onOk() {
          try {
            await deleteProduct(record.id!)
            messageApi.success('Xóa sản phẩm thành công')
            mutate()
          } catch {
            messageApi.error('Xóa sản phẩm thất bại')
          }
        },
      })
    },
    [mutate, messageApi],
  )

  const handleFormSubmit = async (values: Partial<ProductPojo>) => {
    setFormSubmitting(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, values as ProductPojo)
        messageApi.success('Cập nhật sản phẩm thành công')
      } else {
        await createProduct(values as ProductPojo)
        messageApi.success('Tạo sản phẩm thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý sản phẩm</Title>
        <Text type="secondary">Danh sách, thêm, sửa, xóa sản phẩm</Text>
      </div>

      {/* Filters */}
      <FilterToolbar
        params={queryParams}
        onChange={setTableFetchingParams}
        categories={categories}
        onAddNew={handleAddNew}
      />

      {/* Table */}
      <DataTable
        data={tableData}
        loading={isLoading}
        total={0}
        current={Number(queryParams.page) || 1}
        pageSize={Number(queryParams.size) || 20}
        onTableChange={handleTableChange}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      {/* Create / Edit Modal */}
      <ProductFormModal
        open={formOpen}
        editing={editingProduct}
        loading={formSubmitting}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Drawer */}
      <ProductDetailDrawer
        open={detailOpen}
        product={selectedProduct}
        onClose={() => setDetailOpen(false)}
        onEdit={handleDetailEdit}
      />
    </>
  )
}

export default ProductListView
