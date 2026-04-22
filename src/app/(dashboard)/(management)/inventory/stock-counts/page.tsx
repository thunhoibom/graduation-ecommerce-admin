'use client'

import React, { useMemo, useState } from 'react'
import { Breadcrumb, Button, Card, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  approveStockCount,
  completeStockCount,
  createStockCount,
  getStockCountById,
  listStockCounts,
  postStockCountVariance,
  startStockCount,
  upsertStockCountLines,
  type StockCountLineUpsertRequest,
  type StockCountSessionCreateRequest,
  type StockCountSessionPojo,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'

const { Title, Text } = Typography

const statusColor: Record<string, string> = {
  PLANNED: 'default',
  IN_PROGRESS: 'blue',
  COUNTED: 'gold',
  APPROVED: 'purple',
  POSTED: 'green',
}

export default function InventoryStockCountsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedId, setSelectedId] = useState<number>()
  const [createOpen, setCreateOpen] = useState(false)
  const [lineOpen, setLineOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createForm] = Form.useForm<StockCountSessionCreateRequest>()
  const [lineForm] = Form.useForm<StockCountLineUpsertRequest>()

  const { data, isLoading, mutate } = useAxiosSWR<StockCountSessionPojo[]>(
    [SWR_KEYS.INVENTORY_STOCK_COUNTS, statusFilter],
    async () => listStockCounts(statusFilter),
    { revalidateOnMount: true },
  )
  const { data: detail, mutate: mutateDetail } = useAxiosSWR<StockCountSessionPojo>(
    selectedId ? [SWR_KEYS.INVENTORY_STOCK_COUNT_DETAIL, selectedId] : null,
    selectedId ? async () => getStockCountById(selectedId) : null,
    { revalidateOnMount: true },
  )

  const openLineModal = () => {
    if (!detail) return
    lineForm.setFieldsValue({
      lines: detail.lines?.map((line) => ({
        variantId: line.variantId,
        countedQty: line.countedQty ?? line.expectedQty,
        reason: line.reason,
      })),
    })
    setLineOpen(true)
  }

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

  const onCreate = async (values: StockCountSessionCreateRequest) => {
    setSubmitting(true)
    try {
      await createStockCount(values)
      messageApi.success('Đã tạo phiên kiểm kê')
      setCreateOpen(false)
      createForm.resetFields()
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể tạo phiên kiểm kê')
    } finally {
      setSubmitting(false)
    }
  }

  const onSaveLines = async (values: StockCountLineUpsertRequest) => {
    if (!selectedId) return
    setSubmitting(true)
    try {
      await upsertStockCountLines(selectedId, values)
      messageApi.success('Đã cập nhật kết quả đếm')
      setLineOpen(false)
      refresh()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể lưu kết quả đếm')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<StockCountSessionPojo> = [
    { title: 'Mã phiên', dataIndex: 'code', width: 180, render: (v) => <Text code>{v}</Text> },
    { title: 'Kho', dataIndex: 'warehouseId', width: 120 },
    { title: 'Vị trí', dataIndex: 'locationCode', width: 120 },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (s) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', width: 180, render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '-') },
    { title: 'Thao tác', width: 120, render: (_, r) => <Button size="small" onClick={() => setSelectedId(r.id)}>Chi tiết</Button> },
  ]

  const varianceRows = useMemo(() => (detail?.lines ?? []).filter((line) => (line.varianceQty ?? 0) !== 0), [detail])

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Kiểm kê' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>Kiểm kê định kỳ</Title>
      </div>

      <Card
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Lọc trạng thái"
              style={{ width: 220 }}
              options={['PLANNED', 'IN_PROGRESS', 'COUNTED', 'APPROVED', 'POSTED'].map((s) => ({ label: s, value: s }))}
              onChange={setStatusFilter}
            />
            <Button type="primary" onClick={() => setCreateOpen(true)}>Tạo phiên kiểm kê</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={data ?? []} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        title={detail ? `Stock Count ${detail.code}` : 'Chi tiết kiểm kê'}
        width={920}
        open={!!selectedId}
        onClose={() => setSelectedId(undefined)}
        extra={
          detail && (
            <Space>
              {detail.status === 'PLANNED' && <Button onClick={() => runAction(() => startStockCount(detail.id, {}), 'Đã bắt đầu kiểm kê')}>Start</Button>}
              {detail.status === 'IN_PROGRESS' && (
                <>
                  <Button onClick={openLineModal}>Nhập kết quả đếm</Button>
                  <Button onClick={() => runAction(() => completeStockCount(detail.id, {}), 'Đã chốt kết quả đếm')}>Complete Count</Button>
                </>
              )}
              {detail.status === 'COUNTED' && <Button onClick={() => runAction(() => approveStockCount(detail.id, {}), 'Đã approve kiểm kê')}>Approve</Button>}
              {detail.status === 'APPROVED' && <Button type="primary" onClick={() => runAction(() => postStockCountVariance(detail.id, {}), 'Đã post variance')}>Post Variance</Button>}
            </Space>
          )
        }
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text>Kho/Vị trí: {detail?.warehouseId} / {detail?.locationCode}</Text><br />
          <Text>Trạng thái: <Tag color={statusColor[detail?.status ?? ''] ?? 'default'}>{detail?.status}</Tag></Text><br />
          <Text>Ghi chú: {detail?.note || '-'}</Text>
        </Card>

        <Table
          rowKey="id"
          dataSource={detail?.lines ?? []}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'SKU', dataIndex: 'variantSku', width: 170, render: (v) => <Text code>{v}</Text> },
            { title: 'Sản phẩm', dataIndex: 'productName' },
            { title: 'Expected', dataIndex: 'expectedQty', width: 90, align: 'right' },
            { title: 'Counted', dataIndex: 'countedQty', width: 90, align: 'right', render: (v) => v ?? '-' },
            {
              title: 'Variance',
              dataIndex: 'varianceQty',
              width: 90,
              align: 'right',
              render: (v) => {
                const value = Number(v ?? 0)
                return <Text style={{ color: value > 0 ? '#389e0d' : value < 0 ? '#cf1322' : undefined }}>{value > 0 ? `+${value}` : value}</Text>
              },
            },
            { title: 'Reason', dataIndex: 'reason', width: 240 },
          ]}
        />

        {varianceRows.length > 0 && (
          <Card size="small" title="Các dòng có chênh lệch" style={{ marginTop: 16 }}>
            <Text type="secondary">Tổng dòng có variance: {varianceRows.length}</Text>
          </Card>
        )}
      </Drawer>

      <Modal
        title="Tạo phiên kiểm kê"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={createForm} layout="vertical" onFinish={onCreate} initialValues={{ warehouseId: 'MAIN', locationCode: 'MAIN-A1' }}>
          <Form.Item name="warehouseId" label="Kho"><Input /></Form.Item>
          <Form.Item name="locationCode" label="Vị trí"><Input /></Form.Item>
          <Form.Item name="plannedAt" label="Thời điểm dự kiến (ISO)">
            <Input placeholder="2026-04-22T10:00:00Z" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nhập kết quả đếm"
        open={lineOpen}
        onCancel={() => setLineOpen(false)}
        onOk={() => lineForm.submit()}
        confirmLoading={submitting}
        width={760}
      >
        <Form form={lineForm} layout="vertical" onFinish={onSaveLines}>
          <Form.List name="lines">
            {(fields) => (
              <Space direction="vertical" style={{ width: '100%', maxHeight: 420, overflowY: 'auto' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="start">
                    <Form.Item name={[field.name, 'variantId']} label="Variant ID">
                      <InputNumber disabled />
                    </Form.Item>
                    <Form.Item name={[field.name, 'countedQty']} label="Counted Qty" rules={[{ required: true }]}>
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'reason']} label="Lý do chênh lệch">
                      <Input style={{ width: 280 }} />
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
