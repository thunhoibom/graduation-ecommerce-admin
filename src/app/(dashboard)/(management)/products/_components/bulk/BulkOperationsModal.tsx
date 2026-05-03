'use client'

import React, { useState, useCallback } from 'react'
import {
  Modal,
  Tabs,
  Button,
  Space,
  Typography,
  Upload,
  Select,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Alert,
  Table,
  Divider,
  Tooltip,
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import {
  downloadProductsCSV,
  importProducts,
  bulkPublish,
  bulkUnpublish,
  bulkDelete,
  downloadVariantsCSV,
  importVariants,
  bulkActivateVariants,
  bulkDeactivateVariants,
  bulkDeleteVariants,
  bulkUpdateVariants,
  type BulkOperationResult,
  type ProductCsvImportResult,
} from '@/services/rest-api/app-api/products/product-service'
import { createPromotionRule } from '@/services/rest-api/app-api/promotions/promotion-rule-service'

const { Text, Title } = Typography

type ProductDiscountTarget = {
  id: number
  barcode: string
  name: string
}

interface BulkOperationsModalProps {
  open: boolean
  onClose: () => void
  /** Selected product IDs for bulk actions (from table checkbox) */
  selectedIds: number[]
  /** Selected products with barcode for discount rule creation */
  selectedProducts: ProductDiscountTarget[]
  /** All product IDs for "select all" */
  allProductIds: number[]
  /** Selected variant IDs for bulk actions */
  selectedVariantIds: number[]
  /** Current product barcode (for variant page context) */
  productBarcode?: string
  categories: { code: string; name: string }[]
  onBulkComplete: () => void
}

// ─── Product CSV ────────────────────────────────────────────────

const PRODUCT_CSV_TEMPLATE = [
  ['barcode', 'name', 'description', 'price', 'categoryCode', 'status'],
  ['SKU001', 'Tên sản phẩm', 'Mô tả ngắn', '199000', 'CAT001', 'DRAFT'],
]

// ─── Variant CSV ────────────────────────────────────────────────

const VARIANT_CSV_TEMPLATE = [
  ['sku', 'productBarcode', 'size', 'color', 'attributes', 'priceModifier', 'criticalStock', 'barcode', 'active'],
  ['SKU001-S-RED', 'SKU001', 'S', 'Đỏ', '{"material":"cotton"}', '0', '3', '8901234567890', 'true'],
]

// ─── Component ──────────────────────────────────────────────────

const BulkOperationsModal: React.FC<BulkOperationsModalProps> = ({
  open,
  onClose,
  selectedIds,
  selectedProducts,
  selectedVariantIds,
  productBarcode,
  categories,
  onBulkComplete,
}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const [discountForm] = Form.useForm()
  const [variantBulkEditForm] = Form.useForm()
  const [tab, setTab] = useState<'products' | 'product-discount' | 'variants'>('products')
  const [uploading, setUploading] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkOperationResult | null>(null)
  const [importResult, setImportResult] = useState<ProductCsvImportResult | null>(null)
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([])

  const resetResults = () => {
    setBulkResult(null)
    setImportResult(null)
    setBulkAction(null)
  }

  // ── Product bulk action ───────────────────────────────────────

  const handleProductBulkAction = useCallback(
    async (action: 'publish' | 'unpublish' | 'delete') => {
      if (selectedIds.length === 0) {
        messageApi.warning('Chưa chọn sản phẩm nào để thực hiện thao tác.')
        return
      }
      resetResults()
      setBulkAction(action)
      setUploading(true)
      try {
        let result: BulkOperationResult
        switch (action) {
          case 'publish':  result = await bulkPublish(selectedIds); break
          case 'unpublish': result = await bulkUnpublish(selectedIds); break
          case 'delete':   result = await bulkDelete(selectedIds); break
        }
        setBulkResult(result)
        if (result.successCount > 0) onBulkComplete()
      } catch (err) {
        messageApi.error('Thao tác thất bại: ' + (err instanceof Error ? err.message : String(err)))
        setBulkResult({ successCount: 0, errorCount: selectedIds.length, errors: ['Lỗi kết nối server'] })
      } finally {
        setUploading(false)
      }
    },
    [selectedIds, messageApi, onBulkComplete],
  )

  const handleCreateProductDiscountRule = useCallback(async () => {
    if (selectedProducts.length === 0) {
      messageApi.warning('Chưa có sản phẩm được chọn để áp dụng giảm giá.')
      return
    }

    try {
      const values = await discountForm.validateFields()
      const barcodes = selectedProducts
        .map((product) => product.barcode?.trim())
        .filter((barcode): barcode is string => Boolean(barcode))

      if (barcodes.length === 0) {
        messageApi.warning('Không tìm thấy barcode hợp lệ trong danh sách đã chọn.')
        return
      }

      const payload = {
        name: values.ruleName as string,
        priority: Number(values.priority ?? 100),
        combinable: Boolean(values.combinable),
        active: true,
        scope: 'PRODUCT' as const,
        conditions: [
          {
            factField: 'cart.has_any_product',
            operator: 'IN' as const,
            targetValue: barcodes.join(','),
          },
        ],
        actions: [
          {
            actionType: values.actionType as 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT',
            value: Number(values.actionValue),
          },
        ],
      }

      if (
        payload.actions[0].actionType === 'PERCENTAGE_DISCOUNT' &&
        (payload.actions[0].value < 1 || payload.actions[0].value > 100)
      ) {
        messageApi.warning('Giảm theo % chỉ hợp lệ trong khoảng 1 đến 100.')
        return
      }

      setUploading(true)
      await createPromotionRule(payload)
      messageApi.success(
        `Đã tạo quy tắc giảm giá cho ${barcodes.length} sản phẩm.`
      )
      onBulkComplete()
      discountForm.resetFields()
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) {
        return
      }
      messageApi.error('Không thể tạo quy tắc giảm giá')
    } finally {
      setUploading(false)
    }
  }, [selectedProducts, discountForm, messageApi, onBulkComplete])

  // ── Variant bulk action ──────────────────────────────────────

  const handleVariantBulkAction = useCallback(
    async (action: 'activate' | 'deactivate' | 'delete') => {
      if (selectedVariantIds.length === 0) {
        messageApi.warning('Chưa chọn biến thể nào để thực hiện thao tác.')
        return
      }
      resetResults()
      setBulkAction('variant_' + action)
      setUploading(true)
      try {
        let result: BulkOperationResult
        switch (action) {
          case 'activate':   result = await bulkActivateVariants(selectedVariantIds); break
          case 'deactivate': result = await bulkDeactivateVariants(selectedVariantIds); break
          case 'delete':     result = await bulkDeleteVariants(selectedVariantIds); break
        }
        setBulkResult(result)
        if (result.successCount > 0) onBulkComplete()
      } catch (err) {
        messageApi.error('Thao tác thất bại: ' + (err instanceof Error ? err.message : String(err)))
        setBulkResult({ successCount: 0, errorCount: selectedVariantIds.length, errors: ['Lỗi kết nối server'] })
      } finally {
        setUploading(false)
      }
    },
    [selectedVariantIds, messageApi, onBulkComplete],
  )

  const handleVariantBulkEdit = useCallback(async () => {
    if (selectedVariantIds.length === 0) {
      messageApi.warning('Chưa chọn biến thể nào để thực hiện thao tác.')
      return
    }

    try {
      const values = await variantBulkEditForm.validateFields()
      const payload: {
        ids: number[]
        priceModifier?: number
        active?: boolean
      } = {
        ids: selectedVariantIds,
      }

      if (values.priceModifier !== undefined && values.priceModifier !== null) {
        payload.priceModifier = Number(values.priceModifier)
      }
      if (values.activeState === 'ACTIVE') {
        payload.active = true
      } else if (values.activeState === 'INACTIVE') {
        payload.active = false
      }

      if (
        payload.priceModifier === undefined &&
        payload.active === undefined
      ) {
        messageApi.warning('Vui lòng chọn ít nhất một trường cần cập nhật.')
        return
      }

      resetResults()
      setBulkAction('variant_update')
      setUploading(true)
      const result = await bulkUpdateVariants(payload)
      setBulkResult(result)
      if (result.successCount > 0) {
        onBulkComplete()
      }
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) {
        return
      }
      messageApi.error('Thao tác thất bại: ' + (err instanceof Error ? err.message : String(err)))
      setBulkResult({ successCount: 0, errorCount: selectedVariantIds.length, errors: ['Lỗi kết nối server'] })
    } finally {
      setUploading(false)
    }
  }, [selectedVariantIds, messageApi, onBulkComplete, variantBulkEditForm])

  // ── Product CSV Import ──────────────────────────────────────

  const handleProductImport = useCallback(
    async (file: File) => {
      resetResults()
      setUploading(true)
      try {
        const result = await importProducts(file)
        setImportResult(result)
        if (result.successCount > 0) onBulkComplete()
        if (result.successCount > 0) messageApi.success(`Nhập thành công ${result.successCount} sản phẩm.`)
        if (result.errorCount > 0) messageApi.warning(`${result.errorCount} dòng lỗi.`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        messageApi.error('Import thất bại: ' + msg)
        setImportResult({ totalRows: 0, successCount: 0, errorCount: 1, errors: [{ row: 0, rowData: file.name, error: msg }] })
      } finally {
        setUploading(false)
        setUploadFileList([])
      }
      return false
    },
    [messageApi, onBulkComplete],
  )

  // ── Variant CSV Import ───────────────────────────────────────

  const handleVariantImport = useCallback(
    async (file: File) => {
      resetResults()
      setUploading(true)
      try {
        const result = await importVariants(file)
        setImportResult(result)
        if (result.successCount > 0) onBulkComplete()
        if (result.successCount > 0) messageApi.success(`Nhập thành công ${result.successCount} biến thể.`)
        if (result.errorCount > 0) messageApi.warning(`${result.errorCount} dòng lỗi.`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        messageApi.error('Import thất bại: ' + msg)
        setImportResult({ totalRows: 0, successCount: 0, errorCount: 1, errors: [{ row: 0, rowData: file.name, error: msg }] })
      } finally {
        setUploading(false)
        setUploadFileList([])
      }
      return false
    },
    [messageApi, onBulkComplete],
  )

  // ── Export & Template helpers ────────────────────────────────

  const handleProductExport = (categoryCode?: string) => {
    downloadProductsCSV(categoryCode, 'products.csv')
    messageApi.success('Bắt đầu tải file CSV sản phẩm...')
  }

  const handleVariantExport = () => {
    downloadVariantsCSV(productBarcode, productBarcode ? `variants_${productBarcode}.csv` : 'variants.csv')
    messageApi.success('Bắt đầu tải file CSV biến thể...')
  }

  const handleDownloadTemplate = (type: 'product' | 'variant') => {
    // Dynamic import to avoid circular issues — just use generateCSV if available
    // We construct manually since generateCSV isn't imported here
    const rows = type === 'product' ? PRODUCT_CSV_TEMPLATE : VARIANT_CSV_TEMPLATE
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = type === 'product' ? 'products_template.csv' : 'variants_template.csv'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    messageApi.success('Đã tải template ' + (type === 'product' ? 'sản phẩm' : 'biến thể'))
  }

  // ── Result renderers ─────────────────────────────────────────

  const renderBulkResult = () => {
    if (!bulkResult) return null
    const isSuccess = bulkResult.errorCount === 0
    return (
      <Alert
        type={isSuccess ? 'success' : 'warning'}
        icon={isSuccess ? <CheckCircleOutlined /> : <WarningOutlined />}
        style={{ marginTop: 16 }}
        message={
          isSuccess
            ? `Đã cập nhật ${bulkResult.successCount} mục thành công.`
            : `Đã cập nhật ${bulkResult.successCount} mục, ${bulkResult.errorCount} thất bại.`
        }
        description={
          bulkResult.errors && bulkResult.errors.length > 0 ? (
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
              {bulkResult.errors.slice(0, 10).map((e, i) => (
                <li key={i} style={{ fontSize: 12 }}>{e}</li>
              ))}
              {bulkResult.errors.length > 10 && (
                <li style={{ fontSize: 12 }}>...và {bulkResult.errors.length - 10} lỗi khác</li>
              )}
            </ul>
          ) : undefined
        }
        showIcon
      />
    )
  }

  const renderImportResult = () => {
    if (!importResult) return null
    const errorCols = [
      { title: 'Dòng', dataIndex: 'row', key: 'row', width: 70 },
      { title: 'Dữ liệu', dataIndex: 'rowData', key: 'rowData', ellipsis: true },
      { title: 'Lỗi', dataIndex: 'error', key: 'error', ellipsis: true },
    ]
    return (
      <>
        <Alert
          style={{ marginTop: 16 }}
          type={importResult.errorCount === 0 ? 'success' : 'info'}
          icon={importResult.errorCount === 0 ? <CheckCircleOutlined /> : undefined}
          message={`Đã xử lý ${importResult.totalRows} dòng — ${importResult.successCount} thành công, ${importResult.errorCount} lỗi.`}
          showIcon={importResult.errorCount === 0}
        />
        {importResult.errors && importResult.errors.length > 0 && (
          <>
            <Text strong style={{ display: 'block', marginTop: 12 }}>
              Chi tiết lỗi ({importResult.errors.length} dòng):
            </Text>
            <Table
              size="small"
              rowKey="row"
              pagination={{ pageSize: 5 }}
              columns={errorCols}
              dataSource={importResult.errors}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </>
    )
  }

  // ── Tab panels ────────────────────────────────────────────────

  const productsTab = {
    key: 'products',
    label: 'Sản phẩm',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Text>
          Đã chọn <Text strong>{selectedIds.length}</Text> sản phẩm.
        </Text>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleProductBulkAction('publish')}
            loading={uploading && bulkAction === 'publish'}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Xuất bản ({selectedIds.length})
          </Button>
          <Button
            danger
            icon={<DownloadOutlined />}
            onClick={() => handleProductBulkAction('unpublish')}
            loading={uploading && bulkAction === 'unpublish'}
          >
            Ẩn ({selectedIds.length})
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => handleProductBulkAction('delete')}
            loading={uploading && bulkAction === 'delete'}
          >
            Xóa ({selectedIds.length})
          </Button>
        </div>
        {renderBulkResult()}
      </div>
    ),
  }

  const productDiscountTab = {
    key: 'product-discount',
    label: 'Giảm giá SP',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="info"
          showIcon
          message={`Đã chọn ${selectedProducts.length} sản phẩm.`}
          description="Hệ thống sẽ tạo một promotion rule mới, tự áp dụng khi giỏ hàng chứa ít nhất 1 barcode đã chọn."
          style={{ marginBottom: 16 }}
        />
        <Form
          form={discountForm}
          layout="vertical"
          initialValues={{
            ruleName: `Giảm giá ${selectedProducts.length} sản phẩm`,
            actionType: 'PERCENTAGE_DISCOUNT',
            actionValue: 10,
            priority: 100,
            combinable: false,
          }}
        >
          <Form.Item
            name="ruleName"
            label="Tên chương trình giảm giá"
            rules={[{ required: true, message: 'Vui lòng nhập tên chương trình' }]}
          >
            <Input placeholder="VD: Flash sale nhóm sản phẩm nam" />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }} align="start">
            <Form.Item
              name="actionType"
              label="Kiểu giảm giá"
              rules={[{ required: true, message: 'Chọn kiểu giảm giá' }]}
              style={{ minWidth: 220 }}
            >
              <Select
                options={[
                  { label: 'Giảm theo %', value: 'PERCENTAGE_DISCOUNT' },
                  { label: 'Giảm số tiền cố định (VND)', value: 'FIXED_DISCOUNT' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="actionValue"
              label="Giá trị"
              rules={[{ required: true, message: 'Nhập giá trị giảm' }]}
              style={{ minWidth: 200 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="priority"
              label="Ưu tiên"
              rules={[{ required: true, message: 'Nhập độ ưu tiên' }]}
              style={{ minWidth: 140 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            name="combinable"
            label="Cho phép cộng dồn với rule khác"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>

        <Button
          type="primary"
          style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
          loading={uploading}
          disabled={selectedProducts.length === 0}
          onClick={handleCreateProductDiscountRule}
        >
          Tạo rule giảm giá cho sản phẩm đã chọn
        </Button>
      </div>
    ),
  }

  const variantsTab = {
    key: 'variants',
    label: 'Biến thể',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Text>
          Đã chọn <Text strong>{selectedVariantIds.length}</Text> biến thể.
          {productBarcode && <Text type="secondary"> · Lọc theo sản phẩm: {productBarcode}</Text>}
        </Text>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleVariantBulkAction('activate')}
            loading={uploading && bulkAction === 'variant_activate'}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Kích hoạt ({selectedVariantIds.length})
          </Button>
          <Button
            icon={<StopOutlined />}
            onClick={() => handleVariantBulkAction('deactivate')}
            loading={uploading && bulkAction === 'variant_deactivate'}
          >
            Vô hiệu hóa ({selectedVariantIds.length})
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => handleVariantBulkAction('delete')}
            loading={uploading && bulkAction === 'variant_delete'}
          >
            Xóa ({selectedVariantIds.length})
          </Button>
        </div>
        <Divider />
        <Form
          form={variantBulkEditForm}
          layout="vertical"
          initialValues={{ activeState: 'UNCHANGED' }}
        >
          <Space style={{ width: '100%' }} align="start" wrap>
            <Form.Item
              name="priceModifier"
              label="Giá modifier"
              style={{ minWidth: 180 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="Giữ nguyên nếu bỏ trống" />
            </Form.Item>
            <Form.Item
              name="activeState"
              label="Trạng thái active"
              style={{ minWidth: 180 }}
            >
              <Select
                options={[
                  { label: 'Giữ nguyên', value: 'UNCHANGED' },
                  { label: 'Kích hoạt', value: 'ACTIVE' },
                  { label: 'Vô hiệu hóa', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>
          </Space>
          <Button
            type="primary"
            onClick={handleVariantBulkEdit}
            loading={uploading && bulkAction === 'variant_update'}
            style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
          >
            Cập nhật hàng loạt ({selectedVariantIds.length})
          </Button>
        </Form>
        {renderBulkResult()}
      </div>
    ),
  }

  const productImportTab = {
    key: 'product-import',
    label: 'Nhập SP',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="info"
          message="Định dạng CSV (UTF-8). Tải template để đảm bảo cấu trúc đúng."
          action={
            <Button size="small" icon={<FileTextOutlined />} onClick={() => handleDownloadTemplate('product')}>
              Template SP
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
        <Upload.Dragger
          accept=".csv"
          fileList={uploadFileList}
          beforeUpload={handleProductImport}
          onRemove={() => setUploadFileList([])}
          onChange={({ fileList }) => setUploadFileList(fileList)}
          style={{ width: '100%' }}
          disabled={uploading}
        >
          <p style={{ margin: 0 }}><UploadOutlined style={{ fontSize: 24, color: '#5856d6' }} /></p>
          <Text>Kéo file CSV vào đây hoặc nhấn để chọn</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Dung lượng tối đa: 5MB</Text>
        </Upload.Dragger>
        {uploading && <Alert type="info" message="Đang xử lý import..." style={{ marginTop: 12 }} showIcon />}
        {renderImportResult()}
      </div>
    ),
  }

  const variantImportTab = {
    key: 'variant-import',
    label: 'Nhập VT',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="info"
          message="Mỗi dòng = 1 biến thể, cần productBarcode để liên kết với sản phẩm cha."
          action={
            <Button size="small" icon={<FileTextOutlined />} onClick={() => handleDownloadTemplate('variant')}>
              Template VT
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
        <Upload.Dragger
          accept=".csv"
          fileList={uploadFileList}
          beforeUpload={handleVariantImport}
          onRemove={() => setUploadFileList([])}
          onChange={({ fileList }) => setUploadFileList(fileList)}
          style={{ width: '100%' }}
          disabled={uploading}
        >
          <p style={{ margin: 0 }}><UploadOutlined style={{ fontSize: 24, color: '#5856d6' }} /></p>
          <Text>Kéo file CSV vào đây hoặc nhấn để chọn</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Dung lượng tối đa: 5MB</Text>
        </Upload.Dragger>
        {uploading && <Alert type="info" message="Đang xử lý import..." style={{ marginTop: 12 }} showIcon />}
        {renderImportResult()}
      </div>
    ),
  }

  const productExportTab = {
    key: 'product-export',
    label: 'Xuất SP',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Lọc theo danh mục (tùy chọn):</Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả sản phẩm"
              style={{ width: 300 }}
              options={categories.map((c) => ({ label: c.name, value: c.code }))}
              onChange={(val) => handleProductExport(val ?? undefined)}
            />
          </div>
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleProductExport()}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Tải CSV
            </Button>
            <Tooltip title="Tải file mẫu 1 dòng để biết cấu trúc cột">
              <Button icon={<FileTextOutlined />} onClick={() => handleDownloadTemplate('product')}>
                Template
              </Button>
            </Tooltip>
          </Space>
        </Space>
        <Divider />
        <Alert type="info" message="Cột: barcode, name, description, price, categoryCode, status. (Tồn kho quản lý ở trang Biến thể)" />
      </div>
    ),
  }

  const variantExportTab = {
    key: 'variant-export',
    label: 'Xuất VT',
    children: (
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="info"
          message={
            productBarcode
              ? `Đang lọc biến thể của sản phẩm: ${productBarcode}`
              : 'Xuất tất cả biến thể (hoặc lọc theo sản phẩm trên trang quản lý biến thể).'
          }
          style={{ marginBottom: 16 }}
        />
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleVariantExport}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Tải CSV biến thể
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => handleDownloadTemplate('variant')}>
              Template
            </Button>
          </Space>
        </Space>
        <Divider />
        <Alert type="info" message="Cột: sku, productBarcode, size, color, attributes, priceModifier, criticalStock, barcode, active. (Tồn kho quản lý ở màn Inventory)" />
      </div>
    ),
  }

  const tabItems = [
    productsTab,
    productDiscountTab,
    variantsTab,
    productImportTab,
    variantImportTab,
    productExportTab,
    variantExportTab,
  ]

  return (
    <>
      {contextHolder}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Thao tác hàng loạt</Title>}
        open={open}
        onCancel={onClose}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <Tabs
          activeKey={tab}
          onChange={(k) => { setTab(k as typeof tab); resetResults() }}
          items={tabItems}
        />
      </Modal>
    </>
  )
}

export default BulkOperationsModal