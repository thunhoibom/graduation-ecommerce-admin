'use client'

import React, { useState } from 'react'
import { Breadcrumb, Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  type SupplierPojo,
  type SupplierUpsertRequest,
} from '@/services/rest-api/app-api/inventory/inventory-management-service'

const { Title, Text } = Typography

export default function InventorySuppliersPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<SupplierUpsertRequest>()

  const { data, isLoading, mutate } = useAxiosSWR<SupplierPojo[]>(
    [SWR_KEYS.INVENTORY_SUPPLIERS, keyword],
    async () => listSuppliers(keyword || undefined),
    { revalidateOnMount: true },
  )

  const onCreate = async (values: SupplierUpsertRequest) => {
    setSubmitting(true)
    try {
      await createSupplier(values)
      messageApi.success('Đã tạo nhà cung cấp')
      setOpen(false)
      form.resetFields()
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể tạo nhà cung cấp')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteSupplier(id)
      messageApi.success('Đã xóa mềm nhà cung cấp')
      mutate()
    } catch (e) {
      messageApi.error((e as Error)?.message || 'Không thể xóa nhà cung cấp')
    }
  }

  const columns: ColumnsType<SupplierPojo> = [
    { title: 'Mã', dataIndex: 'code', width: 280, render: (v) => <Text code>{v}</Text> },
    { title: 'Tên', dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Liên hệ', dataIndex: 'contactName', width: 180 },
    { title: 'SĐT', dataIndex: 'phone', width: 140 },
    { title: 'Email', dataIndex: 'email', width: 220 },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 110,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Đang hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      width: 110,
      render: (_, record) => (
        <Popconfirm title="Xóa mềm nhà cung cấp?" onConfirm={() => onDelete(record.id)}>
          <Button danger size="small">Xóa</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Tồn kho' }, { title: 'Nhà cung cấp' }]} />
        <Title level={3} style={{ margin: '8px 0 0' }}>Nhà cung cấp</Title>
      </div>

      <Card
        extra={
          <Space>
            <Input.Search
              placeholder="Tìm theo tên/mã"
              allowClear
              style={{ width: 260 }}
              onSearch={(v) => setKeyword(v)}
            />
            <Button type="primary" onClick={() => setOpen(true)}>Thêm nhà cung cấp</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={isLoading} dataSource={data ?? []} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="Tạo nhà cung cấp"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ active: true }}>
          <Form.Item name="code" label="Mã NCC">
            <Input placeholder="SUP-001" />
          </Form.Item>
          <Form.Item name="name" label="Tên NCC" rules={[{ required: true, message: 'Nhập tên nhà cung cấp' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
