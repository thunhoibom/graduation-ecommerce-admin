'use client'

import React, { useEffect, useMemo } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  TreeSelect,
  Row,
  Col,
  Spin,
  message,
  Upload,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCategories,
  createProduct,
  updateProduct,
  type ProductPojo,
  type ProductCategoryPojo,
  type PageResponse,
  type ImagePojo,
} from '@/services/rest-api/app-api/products/product-service'

import { uploadImage } from '@/services/rest-api/app-api/media/media-service'

interface ProductFormModalProps {
  open: boolean
  editing?: ProductPojo | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: Partial<ProductPojo>) => Promise<void>
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  editing,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [fileList, setFileList] = React.useState<UploadFile[]>([])

  // Load categories
  const { data: categoryData } = useAxiosSWR<PageResponse<ProductCategoryPojo[]>>(
    [SWR_KEYS.CATEGORY_LIST, { page: 1, size: 100 }],
    async () => searchCategories({ pageIndex: 0, pageSize: 100 } as any),
    { revalidateOnMount: true },
  )

  const categories = categoryData?.items ?? []
  
  // Build a tree structure for TreeSelect
  const treeData = useMemo(() => {
    if (!categories.length) return []

    const map = new Map<string, any>()
    const roots: any[] = []

    // First pass: create nodes
    categories.forEach((cat) => {
      map.set(cat.code, {
        title: cat.name,
        value: cat.code,
        key: cat.code,
        children: [],
      })
    })

    // Second pass: link parents/children
    categories.forEach((cat) => {
      const node = map.get(cat.code)
      if (cat.parent?.code && map.has(cat.parent.code)) {
        map.get(cat.parent.code).children.push(node)
      } else {
        roots.push(node)
      }
    })

    // Recursive cleanup to remove empty children arrays
    const cleanup = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.children.length === 0) {
          delete node.children
        } else {
          cleanup(node.children)
        }
      })
    }

    cleanup(roots)
    return roots
  }, [categories])



  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          barcode: editing.barcode,
          description: editing.description,
          price: editing.price,
          status: editing.status || 'DRAFT',
          currentStock: editing.currentStock ?? 0,
          criticalStock: editing.criticalStock ?? 0,
          categoryCode: editing.category?.code,
          images: editing.images ?? [],
        })
        // Initialize file list for Upload component
        setFileList((editing.images ?? []).map((img, idx) => ({
          uid: img.code ?? String(idx),
          name: img.filename ?? 'image',
          status: 'done',
          url: img.url ?? '',
          response: img, // Store the full object in response
        })))

      } else {
        form.resetFields()
        form.setFieldsValue({ status: 'DRAFT', currentStock: 0, criticalStock: 0 })
        setFileList([])
      }
    }
  }, [open, editing, form])

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await uploadImage(file as File)
      onSuccess?.(result)
      // Update form images value
      const currentImages = form.getFieldValue('images') ?? []
      form.setFieldsValue({ images: [...currentImages, result] })
    } catch (err) {
      onError?.(err as Error)
      messageApi.error('Upload ảnh thất bại')
    }
  }

  const handleRemove = (file: UploadFile) => {
    const currentImages = form.getFieldValue('images') ?? []
    const newImages = currentImages.filter((img: any) => img.url !== file.url && img.code !== file.uid)
    form.setFieldsValue({ images: newImages })
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const { currentStock: _currentStock, criticalStock: _criticalStock, ...safeValues } = values

      // Extract ImagePojo objects from the fileList state or form values
      const imagePojos = fileList
        .filter(file => file.status === 'done')
        .map(file => file.response as ImagePojo)

      // Map categoryCode to category object
      const payload = {
        ...safeValues,
        images: imagePojos,
        category: safeValues.categoryCode
          ? { code: safeValues.categoryCode, name: '' }
          : undefined,
      }
      await onSubmit(payload)
    } catch {
      // Validation failed — let Ant Form handle it
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={open}
        onOk={handleOk}
        onCancel={onCancel}
        confirmLoading={loading}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            <Form.Item label="Hình ảnh sản phẩm">
              <Upload
                listType="picture-card"
                fileList={fileList}
                customRequest={handleUpload}
                onChange={handleChange}
                onRemove={handleRemove}
                maxCount={1}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>


            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  name="barcode"
                  label="Barcode"
                  rules={[{ required: true, message: 'Vui lòng nhập barcode' }]}
                >
                  <Input placeholder="VD: SP001" disabled={!!editing} />
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
                  <TreeSelect
                    placeholder="Chọn danh mục"
                    allowClear
                    showSearch
                    treeNodeFilterProp="title"
                    treeData={treeData}
                    treeDefaultExpandAll
                    style={{ width: '100%' }}
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

            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item name="currentStock" label="Tồn kho hiện tại">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="criticalStock" label="Ngưỡng tồn kho thấp">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select
                    options={[
                      { label: 'Bản nháp', value: 'DRAFT' },
                      { label: 'Đang bán', value: 'PUBLISHED' },
                      { label: 'Ngừng bán', value: 'UNLISTED' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} placeholder="Mô tả sản phẩm..." />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  )
}

export default ProductFormModal
