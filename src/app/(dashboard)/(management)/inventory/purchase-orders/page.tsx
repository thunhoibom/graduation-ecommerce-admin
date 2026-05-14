'use client'

import React, { useMemo, useState } from 'react'
import { Breadcrumb, Button, Card, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message, Alert, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  approvePurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  listSuppliers,
  receivePurchaseOrder,
  submitPurchaseOrder,
  type GoodsReceiptCreateRequest,
  type PurchaseOrderCreateRequest,
  type PurchaseOrderPojo,
  type SupplierPojo,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'
import { searchVariants, type ProductVariantPojo } from '@/services/rest-api/app-api/products/product-service'
import { useBarcodeScanner } from '@/shared/hooks/useBarcodeScanner'
import { playSuccessBeep, playErrorBuzzer } from '@/shared/utils/soundUtils'

const { Title, Text } = Typography

const statusColor: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'gold',
  APPROVED: 'blue',
  PARTIALLY_RECEIVED: 'orange',
  RECEIVED: 'green',
  CANCELLED: 'red',
}

export default function PurchaseOrdersPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedId, setSelectedId] = useState<number>()
  const [createOpen, setCreateOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [createForm] = Form.useForm<PurchaseOrderCreateRequest>()
  const [receiveForm] = Form.useForm<GoodsReceiptCreateRequest>()

  const { data, isLoading, mutate } = useAxiosSWR<PurchaseOrderPojo[]>(
    [SWR_KEYS.INVENTORY_PURCHASE_ORDERS, statusFilter],
    async () => listPurchaseOrders(statusFilter),
    { revalidateOnMount: true },
  )

  const { data: detail, mutate: mutateDetail } = useAxiosSWR<PurchaseOrderPojo>(
    selectedId ? [SWR_KEYS.INVENTORY_PURCHASE_ORDER_DETAIL, selectedId] : null,
    selectedId ? async () => getPurchaseOrderById(selectedId) : null,
    { revalidateOnMount: true },
  )

  const { data: suppliers } = useAxiosSWR<SupplierPojo[]>(
    [SWR_KEYS.INVENTORY_SUPPLIERS, 'po-create'],
    async () => listSuppliers(),
    { revalidateOnMount: true },
  )
  const { data: variantsResponse } = useAxiosSWR<{ items: ProductVariantPojo[] }>(
    [SWR_KEYS.VARIANT_LIST, 'po-create'],
    async () => searchVariants({ pageIndex: 0, pageSize: 500 }),
    { revalidateOnMount: true },
  )
  const variants = variantsResponse?.items ?? []

  const variantOptions = useMemo(
    () =>
      variants.map((v) => ({
        label: `${v.sku} · ${v.productName ?? 'N/A'}`,
        value: v.id!,
      })),
    [variants],
  )

  const refreshAll = () => {
    mutate()
    mutateDetail()
  }

  useBarcodeScanner({
    isActive: receiveOpen && isScanning,
    onScan: (barcode) => {
      if (!detail?.lines) return

      const lines = receiveForm.getFieldValue('lines') || []
      
      // Find matching line by barcode (if added to Pojo) or variantSku
      const matchedLineIndex = detail.lines.findIndex(l => 
        (l as any).barcode === barcode || l.variantSku === barcode
      )

      if (matchedLineIndex === -1) {
        playErrorBuzzer()
        setScanMessage({ type: 'error', text: `Không tìm thấy sản phẩm có mã ${barcode} trong đơn hàng này!` })
        return
      }

      const poLine = detail.lines[matchedLineIndex]
      const currentReceived = lines[matchedLineIndex]?.receivedQty || 0
      
      // We can allow over-receiving, but usually we just increment
      const newQty = currentReceived + 1
      
      // Update form
      const newLines = [...lines]
      newLines[matchedLineIndex] = {
        ...newLines[matchedLineIndex],
        receivedQty: newQty
      }
      receiveForm.setFieldsValue({ lines: newLines })
      
      playSuccessBeep()
      setScanMessage({ type: 'success', text: `Quét thành công: ${poLine.productName || poLine.variantSku} (+1)` })
    }
  })

  const runAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action()
      messageApi.success(successMsg)
      refreshAll()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể thực hiện thao tác')
    }
  }

  const handleCreate = async (values: PurchaseOrderCreateRequest) => {
    setSubmitting(true)
    try {
      await createPurchaseOrder(values)
      messageApi.success('Đã tạo Purchase Order')
      setCreateOpen(false)
      createForm.resetFields()
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể tạo PO')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReceive = async (values: GoodsReceiptCreateRequest) => {
    if (!selectedId) return
    setSubmitting(true)
    try {
      await receivePurchaseOrder(selectedId, values)
      messageApi.success('Đã nhập kho theo PO')
      setReceiveOpen(false)
      receiveForm.resetFields()
      refreshAll()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể nhập kho')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<PurchaseOrderPojo> = [
    { title: 'Mã PO', dataIndex: 'code', width: 180, render: (v) => <Text code>{v}</Text> },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName' },
    { title: 'Trạng thái', dataIndex: 'status', width: 170, render: (s) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', width: 180, render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '-') },
    { title: 'Kho', dataIndex: 'warehouseId', width: 100 },
    { title: 'Vị trí', dataIndex: 'locationCode', width: 120 },
    {
      title: 'Thao tác',
      width: 140,
      render: (_, r) => <Button size="small" onClick={() => setSelectedId(r.id)}>Chi tiết</Button>,
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Purchase Orders' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>Purchase Orders</Title>
      </div>

      <Card
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Lọc trạng thái"
              style={{ width: 220 }}
              options={['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((s) => ({ label: s, value: s }))}
              onChange={setStatusFilter}
            />
            <Button type="primary" onClick={() => setCreateOpen(true)}>Tạo PO</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={data ?? []} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        title={detail ? `PO ${detail.code}` : 'Chi tiết PO'}
        width={840}
        open={!!selectedId}
        onClose={() => setSelectedId(undefined)}
        extra={
          detail && (
            <Space>
              {detail.status === 'DRAFT' && <Button onClick={() => runAction(() => submitPurchaseOrder(detail.id, {}), 'Đã submit PO')}>Submit</Button>}
              {detail.status === 'SUBMITTED' && <Button onClick={() => runAction(() => approvePurchaseOrder(detail.id, {}), 'Đã approve PO')}>Approve</Button>}
              {(detail.status === 'APPROVED' || detail.status === 'PARTIALLY_RECEIVED') && (
                <Button type="primary" onClick={() => {
                  receiveForm.setFieldsValue({
                    lines: detail.lines?.map((line) => ({
                      purchaseOrderLineId: line.id,
                      receivedQty: 0, // Default to 0 so they can scan
                    })),
                  })
                  setScanMessage(null)
                  setIsScanning(true)
                  setReceiveOpen(true)
                }}>Nhập kho</Button>
              )}
            </Space>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Card size="small">
            <Text>Nhà cung cấp: <Text strong>{detail?.supplierName}</Text></Text><br />
            <Text>Trạng thái: <Tag color={statusColor[detail?.status ?? ''] ?? 'default'}>{detail?.status}</Tag></Text><br />
            <Text>Kho/Vị trí: {detail?.warehouseId} / {detail?.locationCode}</Text><br />
            <Text>Ghi chú: {detail?.note || '-'}</Text>
          </Card>
          <Table
            rowKey="id"
            dataSource={detail?.lines ?? []}
            pagination={false}
            columns={[
              { title: 'SKU', dataIndex: 'variantSku', width: 160, render: (v) => <Text code>{v}</Text> },
              { title: 'Sản phẩm', dataIndex: 'productName' },
              { title: 'Ordered', dataIndex: 'orderedQty', width: 90, align: 'right' },
              { title: 'Received', dataIndex: 'receivedQty', width: 90, align: 'right' },
              { title: 'Unit Cost', dataIndex: 'unitCost', width: 100, align: 'right' },
            ]}
          />
        </Space>
      </Drawer>

      <Modal
        title="Tạo Purchase Order"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
        width={760}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} initialValues={{ warehouseId: 'MAIN', locationCode: 'MAIN-A1', lines: [{ orderedQty: 1 }] }}>
          <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}>
            <Select options={(suppliers ?? []).filter((s) => !s.deleted).map((s) => ({ label: `${s.code} · ${s.name}`, value: s.id }))} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="warehouseId" label="Kho"><Input /></Form.Item>
            <Form.Item name="locationCode" label="Location"><Input /></Form.Item>
          </Space>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="start">
                    <Form.Item name={[field.name, 'variantId']} label="SKU" rules={[{ required: true }]}>
                      <Select showSearch style={{ width: 350 }} options={variantOptions} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'orderedQty']} label="Qty" rules={[{ required: true }]}>
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'unitCost']} label="Unit cost">
                      <InputNumber min={0} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>Xóa</Button>
                  </Space>
                ))}
                <Button onClick={() => add({ orderedQty: 1 })}>+ Thêm dòng</Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
            <span>Nhập kho theo PO</span>
            <Space>
              <Text style={{ fontSize: 14, fontWeight: 'normal' }}>Chế độ quét:</Text>
              <Switch checked={isScanning} onChange={setIsScanning} />
            </Space>
          </div>
        }
        open={receiveOpen}
        onCancel={() => setReceiveOpen(false)}
        onOk={() => receiveForm.submit()}
        confirmLoading={submitting}
        width={700}
      >
        {isScanning && (
          <Alert 
            message="Đang ở chế độ quét mã vạch. Vui lòng dùng máy quét để nhập hàng." 
            type="info" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        {scanMessage && (
          <Alert 
            message={scanMessage.text} 
            type={scanMessage.type} 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={receiveForm} layout="vertical" onFinish={handleReceive}>
          <Form.List name="lines">
            {(fields) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key}>
                    <Form.Item name={[field.name, 'purchaseOrderLineId']} label="Line ID">
                      <InputNumber disabled />
                    </Form.Item>
                    <Form.Item name={[field.name, 'receivedQty']} label="Số lượng nhập" rules={[{ required: true }]}>
                      <InputNumber min={1} />
                    </Form.Item>
                  </Space>
                ))}
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  )
}
