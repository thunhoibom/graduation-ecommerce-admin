'use client'

import React, { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Select, Row, Col, Card, Button, Typography, Spin, message, Breadcrumb, Space } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  getProductById,
  createProduct,
  updateProduct,
  type ProductPojo,
  type ProductCategoryPojo,
  type PageResponse,
} from '@/services/rest-api/app-api/products/product-service'

const { Title, Text } = Typography
const { TextArea } = Input

interface ProductFormPageProps {
  productId?: string
}

const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId }) => {
  const router = useRouter()
  const isEditMode = Boolean(productId)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [submitting, setSubmitting] = useState(false)

  // Load categories
  const { data: categoryData } = useAxiosSWR<PageResponse<ProductCategoryPojo[]>>(
    [SWR_KEYS.CATEGORY_LIST, { page: 1, size: 100 }],
    async () => searchCategories({ page: 1, size: 100 }),
    { revalidateOnMount: true },
  )
  const categories = categoryData?.data ?? []

  // Load product if editing
  const { data: productData, isLoading: loadingProduct } = useAxiosSWR<ProductPojo>(
    isEditMode ? [SWR_KEYS.PRODUCT_DETAIL, productId] : null,
    isEditMode ? async () => getProductById(Number(productId)) : null,
    { revalidateOnMount: true },
  )

  useEffect(() => {
    if (productData && isEditMode) {
      form.setFieldsValue({
        name: productData.name,
        barcode: productData.barcode,
        description: productData.description,
        price: productData.price,
        currentStock: productData.currentStock,
        criticalStock: productData.criticalStock,
        categoryCode: productData.category?.code,
      })
    }
  }, [productData, isEditMode, form])

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: ProductPojo = {
        ...values,
        category: values.categoryCode
          ? { code: values.categoryCode as string, name: '' }
          : undefined,
      } as ProductPojo

      if (isEditMode) {
        await updateProduct(Number(productId), payload)
        messageApi.success('Cập nhật sản phẩm thành công')
      } else {
        await createProduct(payload)
        messageApi.success('Tạo sản phẩm thành công')
      }
      router.push('/products')
    } catch {
      messageApi.error('Thao tác thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <Link href="/products">Sản phẩm</Link> },
            { title: isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' },
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <Title level={3} style={{ margin: 0 }}>
            {isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </Title>
          <Text type="secondary">
            {isEditMode ? 'Cập nhật thông tin sản phẩm' : 'Điền thông tin để tạo sản phẩm mới'}
          </Text>
        </div>
      </div>

      {isEditMode && loadingProduct ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            price: 0,
            currentStock: 0,
            criticalStock: 0,
          }}
        >
          <Row gutter={[24, 0]}>
            {/* Main Info */}
            <Col xs={24} lg={16}>
              <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="barcode"
                      label="Barcode"
                      rules={[{ required: true, message: 'Vui lòng nhập barcode' }]}
                    >
                      <Input
                        placeholder="VD: SP001"
                        disabled={isEditMode}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Tên sản phẩm"
                      rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                    >
                      <Input placeholder="VD: Áo thun nam" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item name="categoryCode" label="Danh mục">
                      <Select
                        placeholder="Chọn danh mục"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={categories.map((c) => ({
                          label: c.name,
                          value: c.code,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="price"
                      label="Giá bán (VND)"
                      rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                        parser={(value) => {
                          const n = Number(value?.replace(/,/g, '') || 0)
                          return (Number.isNaN(n) ? 0 : n) as 0
                        }}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="Mô tả">
                  <TextArea rows={4} placeholder="Mô tả sản phẩm..." />
                </Form.Item>
              </Card>
            </Col>

            {/* Stock Info */}
            <Col xs={24} lg={8}>
              <Card title="Quản lý tồn kho" style={{ marginBottom: 16 }}>
                <Form.Item name="currentStock" label="Tồn kho hiện tại">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="criticalStock" label="Ngưỡng cảnh báo">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </Card>

              {/* Actions */}
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  style={{ width: '100%', backgroundColor: '#5856d6', borderColor: '#5856d6' }}
                >
                  {isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </Button>
                <Link href="/products" style={{ width: '100%' }}>
                  <Button icon={<ArrowLeftOutlined />} style={{ width: '100%' }}>
                    Quay lại danh sách
                  </Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </Form>
      )}
    </>
  )
}

export default ProductFormPage
