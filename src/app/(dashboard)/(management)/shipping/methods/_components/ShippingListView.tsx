'use client'

import React, { useState, useCallback } from 'react'
import {
  Table, Card, Typography, Row, Col, Button, Input, Switch,
  Modal, Form, Space, message, Popconfirm, Tag,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  type ShippingMethodPojo,
  type ShippingSearchParams,
} from '@/services/rest-api/app-api/shipping/shipping-service'
import AppTable from '@/shared/components/antd/AppTable'

const { Title, Text } = Typography

// ── Helpers ──────────────────────────────────────────────────────

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── ShippingListView ─────────────────────────────────────────────

const ShippingListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<ShippingSearchParams>>({
    page: 1,
    size: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethodPojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: ShippingMethodPojo[]
    totalElements: number
  }>(
    [SWR_KEYS.SHIPPING_LIST, queryParams],
    async () => {
      const res = await searchShippingMethods(queryParams as ShippingSearchParams)
      return {
        data: res.data ?? [],
        totalElements: res.totalElements ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, page, size }))
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQueryParams((prev) => ({ ...prev, name: value || undefined, page: 1 }))
  }, [])

  const handleAddNew = () => {
    setEditingMethod(null)
    form.resetFields()
    setFormOpen(true)
  }

  const handleEdit = (record: ShippingMethodPojo) => {
    setEditingMethod(record)
    form.setFieldsValue({
      name: record.name,
      baseFee: record.baseFee,
      freeShippingThreshold: record.freeShippingThreshold,
      estimatedDaysMin: record.estimatedDaysMin,
      estimatedDaysMax: record.estimatedDaysMax,
      active: record.active,
    })
    setFormOpen(true)
  }

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteShippingMethod(id)
      messageApi.success('Xóa phương thức thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }, [mutate, messageApi])

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: ShippingMethodPojo = {
        name: values.name as string,
        baseFee: Number(values.baseFee),
        freeShippingThreshold: values.freeShippingThreshold
          ? Number(values.freeShippingThreshold)
          : undefined,
        estimatedDaysMin: Number(values.estimatedDaysMin),
        estimatedDaysMax: Number(values.estimatedDaysMax),
        active: values.active as boolean ?? true,
      }

      if (editingMethod) {
        await updateShippingMethod(editingMethod.id!, payload)
        messageApi.success('Cập nhật thành công')
      } else {
        await createShippingMethod(payload)
        messageApi.success('Tạo phương thức thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<ShippingMethodPojo> = [
    {
      title: 'Tên phương thức',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: ShippingMethodPojo) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Tag color={record.active ? 'green' : 'default'}>
            {record.active ? 'Đang hoạt động' : 'Tạm tắt'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Phí cơ bản',
      dataIndex: 'baseFee',
      key: 'baseFee',
      width: 130,
      align: 'right',
      render: (v: number) => <Text strong>{formatVND(v)}</Text>,
    },
    {
      title: 'Miễn phí từ',
      dataIndex: 'freeShippingThreshold',
      key: 'freeShippingThreshold',
      width: 130,
      align: 'right',
      render: (v: number | undefined) =>
        v ? formatVND(v) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Giao hàng',
      key: 'deliveryTime',
      width: 150,
      render: (_: unknown, record: ShippingMethodPojo) => (
        <Text>
          {record.estimatedDaysMin}–{record.estimatedDaysMax} ngày
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: boolean, record: ShippingMethodPojo) => (
        <Switch
          checked={active}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
          onChange={() => {
            handleFormSubmit({ ...record, active: !active })
          }}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, record: ShippingMethodPojo) => (
        <Space size={4}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Xóa phương thức giao hàng?"
            description={`Xóa "${record.name}"?`}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Phương thức vận chuyển</Title>
        <Text type="secondary">Quản lý các hình thức giao hàng và phí vận chuyển</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input.Search
              placeholder="Tìm tên phương thức..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={14} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm phương thức
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 700 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} phương thức`,
          onChange: handleTableChange,
        }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingMethod ? 'Sửa phương thức' : 'Thêm phương thức giao hàng'}
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingMethod ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnClose
        width={540}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ active: true, estimatedDaysMin: 1, estimatedDaysMax: 5 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên phương thức"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="VD: Giao hàng tiêu chuẩn" />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="baseFee"
                label="Phí cơ bản (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập phí' }]}
              >
                <Input type="number" min={0} placeholder="VD: 30000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="freeShippingThreshold" label="Miễn phí từ (VND)">
                <Input type="number" min={0} placeholder="VD: 500000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="estimatedDaysMin"
                label="Ngày giao tối thiểu"
                rules={[{ required: true }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedDaysMax"
                label="Ngày giao tối đa"
                rules={[{ required: true, message: 'Vui lòng nhập' }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ShippingListView
