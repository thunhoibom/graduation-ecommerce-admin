'use client'

import React, { useState, useCallback } from 'react'
import { Modal, message, Typography, Space, Button } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAxios } from '@/shared/hooks/use-axios'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  deleteProduct,
  createProduct,
  updateProduct,
  patchProduct,
  type ProductPojo,
  type ProductCategoryPojo,
  type PageResponse,
} from '@/services/rest-api/app-api/products/product-service'
import FilterToolbar from '../toolbar/FilterToolbar'
import DataTable from '../table/DataTable'
import ProductFormModal from '../form/ProductFormModal'
import ProductDetailDrawer from '../detail/ProductDetailDrawer'
import BulkOperationsModal from '../bulk/BulkOperationsModal'
import { useFetchProducts } from '../../_hooks/use-fetch-products'

const { Title, Text } = Typography

const ProductListView: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [messageApi, contextHolder] = message.useMessage()

  const {
    data,
    tableData,
    isLoading,
    queryParams,
    setTableFetchingParams,
    mutate,
  } = useFetchProducts()

  const total = data?.totalCount ?? 0

  // Categories
  const { data: categoryData } = useAxios<PageResponse<ProductCategoryPojo[]>>(
    async () => searchCategories({ pageIndex: 0, pageSize: 100 } as any),
    { enabled: true, deps: [] },
  )
  const categories = categoryData?.items ?? []

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductPojo | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductPojo | null>(null)

  // Bulk operations modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedProducts, setSelectedProducts] = useState<
    { id: number; barcode: string; name: string }[]
  >([])

  // All product IDs (for "select all" when bulk modal is opened)
  const allProductIds = tableData.map((p) => p.id!).filter(Boolean)

  // ── Handlers ────────────────────────────────────────────────

  const handleTableChange = useCallback(
    (page: number, size: number) => {
      setTableFetchingParams({ pageIndex: String(page - 1), pageSize: String(size) })
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
          <Space orientation="vertical" size={4}>
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

  const handleChangeStatus = useCallback(
    async (record: ProductPojo, status: string) => {
      try {
        await patchProduct(record.id!, { status })
        messageApi.success(`Cập nhật trạng thái thành công`)
        mutate()
      } catch {
        messageApi.error('Cập nhật trạng thái thất bại')
      }
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

  const handleBulkComplete = useCallback(() => {
    setSelectedRowKeys([])
    setSelectedProducts([])
    mutate()
  }, [mutate])

  const handleClearFilters = useCallback(() => {
    const size = queryParams.pageSize ?? '20'
    router.replace(`${pathname}?pageIndex=0&pageSize=${encodeURIComponent(size)}`)
    mutate()
  }, [router, pathname, queryParams.pageSize, mutate])

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
        onChange={(params) => {
          setTableFetchingParams(params)
          mutate()
        }}
        categories={categories}
        onAddNew={handleAddNew}
        onBulkOpen={() => setBulkModalOpen(true)}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk actions bar (shows when rows are selected) */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 16px',
            background: '#f0f0f5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text strong style={{ color: '#5956d6' }}>
            Đã chọn {selectedRowKeys.length} sản phẩm
          </Text>
          <Space>
            <Button
              size="small"
              onClick={() => {
                setSelectedRowKeys([])
                setSelectedProducts([])
              }}
            >
              Bỏ chọn
            </Button>
            <Button
              size="small"
              type="primary"
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
              onClick={() => setBulkModalOpen(true)}
            >
              Thao tác hàng loạt
            </Button>
          </Space>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={tableData}
        loading={isLoading}
        total={total}
        current={Number(queryParams.pageIndex) + 1 || 1}
        pageSize={Number(queryParams.pageSize) || 20}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], rows: ProductPojo[]) => {
            setSelectedRowKeys(keys)
            setSelectedProducts(
              rows
                .filter((row) => row.id && row.barcode)
                .map((row) => ({
                  id: row.id as number,
                  barcode: row.barcode,
                  name: row.name,
                }))
            )
          },
        }}
        onTableChange={(page, size) => {
          handleTableChange(page, size)
          mutate()
        }}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onChangeStatus={handleChangeStatus}
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

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedIds={selectedRowKeys as number[]}
        selectedProducts={selectedProducts}
        allProductIds={allProductIds}
        selectedVariantIds={[]}
        categories={categories}
        onBulkComplete={handleBulkComplete}
      />
    </>
  )
}

export default ProductListView