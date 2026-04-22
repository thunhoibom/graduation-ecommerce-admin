'use client'

import React, { useMemo, useState } from 'react'
import { Breadcrumb, Button, Card, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  approveStockTransfer,
  completeStockTransfer,
  createStockTransfer,
  getStockTransferById,
  listStockTransfers,
  submitStockTransfer,
  type StockTransferCreateRequest,
  type StockTransferPojo,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'
import { searchVariants, type ProductVariantPojo } from '@/services/rest-api/app-api/products/product-service'

const { Title, Text } = Typography

const statusColor: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'gold',
  APPROVED: 'blue',
  IN_TRANSIT: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function InventoryTransfersPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedId, setSelectedId] = useState<number>()
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<StockTransferCreateRequest>()

  const { data, isLoading, mutate } = useAxiosSWR<StockTransferPojo[]>(
    [SWR_KEYS.INVENTORY_TRANSFERS, statusFilter],
    async () => listStockTransfers(statusFilter),
    { revalidateOnMount: true },
  )
  const { data: detail, mutate: mutateDetail } = useAxiosSWR<StockTransferPojo>(
    selectedId ? [SWR_KEYS.INVENTORY_TRANSFER_DETAIL, selectedId] : null,
    selectedId ? async () => getStockTransferById(selectedId) : null,
    { revalidateOnMount: true },
  )
  const { data: variantsResponse } = useAxiosSWR<{ items: ProductVariantPojo[] }>(
    [SWR_KEYS.VARIANT_LIST, 'transfer-create'],
    async () => searchVariants({ pageIndex: 0, pageSize: 500 }),
    { revalidateOnMount: true },
  )

  const variantOptions = useMemo(
    () => (variantsResponse?.items ?? []).map((v) => ({ label: `${v.sku} · ${v.productName ?? 'N/A'}`, value: v.id! })),
    [variantsResponse],
  )

  const refresh = () => {
    mutate()
    mutateDetail()
  }

  const runAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action()
      messageApi.success(successMsg)
      refresh()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể thực hiện thao tác')
    }
  }

  const onCreate = async (values: StockTransferCreateRequest) => {
    setSubmitting(true)
    try {
      await createStockTransfer(values)
      messageApi.success('Đã tạo phiếu chuyển kho')
      setCreateOpen(false)
      form.resetFields()
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể tạo phiếu chuyển')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<StockTransferPojo> = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 180, render: (v) => <Text code>{v}</Text> },
    { title: 'From', dataIndex: 'fromLocation', width: 130 },
    { title: 'To', dataIndex: 'toLocation', width: 130 },
    { title: 'Trạng thái', dataIndex: 'status', width: 150, render: (s) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', width: 180, render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '-') },
    { title: 'Thao tác', width: 120, render: (_, r) => <Button size="small" onClick={() => setSelectedId(r.id)}>Chi tiết</Button> },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Chuyển kho' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>Chuyển kho nội bộ</Title>
      </div>

      <Card
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Lọc trạng thái"
              style={{ width: 220 }}
              options={['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map((s) => ({ label: s, value: s }))}
              onChange={setStatusFilter}
            />
            <Button type="primary" onClick={() => setCreateOpen(true)}>Tạo phiếu chuyển</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={isLoading} dataSource={data ?? []} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        title={detail ? `Transfer ${detail.code}` : 'Chi tiết transfer'}
        width={820}
        open={!!selectedId}
        onClose={() => setSelectedId(undefined)}
        extra={
          detail && (
            <Space>
              {detail.status === 'DRAFT' && <Button onClick={() => runAction(() => submitStockTransfer(detail.id, {}), 'Đã submit transfer')}>Submit</Button>}
              {detail.status === 'SUBMITTED' && <Button onClick={() => runAction(() => approveStockTransfer(detail.id, {}), 'Đã approve transfer')}>Approve</Button>}
              {(detail.status === 'APPROVED' || detail.status === 'IN_TRANSIT') && (
                <Button type="primary" onClick={() => runAction(() => completeStockTransfer(detail.id, {}), 'Đã complete transfer')}>Complete</Button>
              )}
            </Space>
          )
        }
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text>Kho: {detail?.warehouseId}</Text><br />
          <Text>Tuyến: {detail?.fromLocation} → {detail?.toLocation}</Text><br />
          <Text>Trạng thái: <Tag color={statusColor[detail?.status ?? ''] ?? 'default'}>{detail?.status}</Tag></Text>
        </Card>
        <Table
          rowKey="id"
          dataSource={detail?.lines ?? []}
          pagination={false}
          columns={[
            { title: 'SKU', dataIndex: 'variantSku', width: 180, render: (v) => <Text code>{v}</Text> },
            { title: 'Sản phẩm', dataIndex: 'productName' },
            { title: 'Số lượng', dataIndex: 'quantity', width: 120, align: 'right' },
          ]}
        />
      </Drawer>

      <Modal
        title="Tạo phiếu chuyển kho"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={760}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          initialValues={{ warehouseId: 'MAIN', fromLocation: 'MAIN-A1', toLocation: 'MAIN-B1', lines: [{ quantity: 1 }] }}
        >
          <Space style={{ width: '100%' }}>
            <Form.Item name="warehouseId" label="Kho"><Input /></Form.Item>
            <Form.Item name="fromLocation" label="From" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="toLocation" label="To" rules={[{ required: true }]}><Input /></Form.Item>
          </Space>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="start">
                    <Form.Item name={[field.name, 'variantId']} label="SKU" rules={[{ required: true }]}>
                      <Select showSearch style={{ width: 380 }} options={variantOptions} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]}>
                      <InputNumber min={1} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>Xóa</Button>
                  </Space>
                ))}
                <Button onClick={() => add({ quantity: 1 })}>+ Thêm dòng</Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  )
}
