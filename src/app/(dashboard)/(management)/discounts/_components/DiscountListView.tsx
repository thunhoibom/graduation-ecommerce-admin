'use client'

import React, { useState, useCallback } from 'react'
import {
  Table, Tag, Space, Button, Typography, Card, Row, Col,
  Select, Input, Modal, Form, InputNumber, Switch, DatePicker,
  message, Popconfirm,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscountActive,
  type DiscountCodePojo,
  type DiscountSearchParams,
  type DiscountType,
} from '@/services/rest-api/app-api/discounts/discount-service'
import AppTable from '@/shared/components/antd/AppTable'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// ── Helpers ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  PERCENT: 'Phần trăm (%)',
  FIXED: 'Số tiền (VND)',
}

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatValue = (type: string, value: number) => {
  if (type === 'PERCENT') return `${value}%`
  return formatVND(value)
}

// ── DiscountListView ──────────────────────────────────────────────

const DiscountListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<DiscountSearchParams>>({
    page: 1,
    size: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCodePojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: DiscountCodePojo[]
    totalElements: number
  }>(
    [SWR_KEYS.DISCOUNT_LIST, queryParams],
    async () => {
      const res = await searchDiscounts(queryParams as DiscountSearchParams)
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

  const handleAddNew = () => {
    setEditingDiscount(null)
    form.resetFields()
    setFormOpen(true)
  }

  const handleEdit = (record: DiscountCodePojo) => {
    setEditingDiscount(record)
    form.setFieldsValue({
      code: record.code,
      description: record.description,
      type: record.type,
      value: record.value,
      maxUses: record.maxUses,
      maxUsesPerCustomer: record.maxUsesPerCustomer,
      minCartValue: record.minCartValue,
      validFrom: record.validFrom ? dayjs(record.validFrom) : null,
      validUntil: record.validUntil ? dayjs(record.validUntil) : null,
      active: record.active,
    })
    setFormOpen(true)
  }

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteDiscount(id)
      messageApi.success('Xóa mã giảm giá thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }, [mutate, messageApi])

  const handleToggleActive = useCallback(async (id: number, active: boolean) => {
    try {
      await toggleDiscountActive(id, !active)
      messageApi.success('Cập nhật trạng thái thành công')
      mutate()
    } catch {
      messageApi.error('Cập nhật thất bại')
    }
  }, [mutate, messageApi])

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: DiscountCodePojo = {
        code: values.code as string,
        description: values.description as string,
        type: values.type as DiscountType,
        value: Number(values.value),
        maxUses: values.maxUses ? Number(values.maxUses) : undefined,
        maxUsesPerCustomer: values.maxUsesPerCustomer ? Number(values.maxUsesPerCustomer) : undefined,
        minCartValue: values.minCartValue ? Number(values.minCartValue) : undefined,
        validFrom: values.validFrom ? (values.validFrom as dayjs.Dayjs).toISOString() : undefined,
        validUntil: values.validUntil ? (values.validUntil as dayjs.Dayjs).toISOString() : undefined,
        active: values.active as boolean,
      }

      if (editingDiscount) {
        await updateDiscount(editingDiscount.id!, payload)
        messageApi.success('Cập nhật mã giảm giá thành công')
      } else {
        await createDiscount(payload)
        messageApi.success('Tạo mã giảm giá thành công')
      }
      setFormOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<DiscountCodePojo> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string, record: DiscountCodePojo) => (
        <Space orientation="vertical" size={0}>
          <Text code strong style={{ fontSize: 13 }}>{code}</Text>
          {record.currentlyValid === false && (
            <Tag color="default" style={{ fontSize: 10 }}>Hết hạn</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => (
        <Tag color={type === 'PERCENT' ? 'blue' : 'purple'}>
          {TYPE_LABELS[type] ?? type}
        </Tag>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      align: 'right',
      render: (value: number, record: DiscountCodePojo) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatValue(record.type, value)}
        </Text>
      ),
    },
    {
      title: 'Đơn hàng tối thiểu',
      dataIndex: 'minCartValue',
      key: 'minCartValue',
      width: 140,
      align: 'right',
      render: (v: number | undefined) => v ? formatVND(v) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Số lần sử dụng',
      key: 'usage',
      width: 140,
      render: (_: unknown, record: DiscountCodePojo) => (
        <div>
          <Text>{record.useCount ?? 0} / {record.maxUses ?? '∞'}</Text>
          {record.remainingUses !== undefined && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Còn lại: {record.remainingUses}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hiệu lực',
      key: 'validity',
      width: 200,
      render: (_: unknown, record: DiscountCodePojo) => (
        <div>
          {record.validFrom && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Từ: {dayjs(record.validFrom).format('DD/MM/YYYY')}
            </Text>
          )}
          {record.validUntil && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Đến: {dayjs(record.validUntil).format('DD/MM/YYYY')}
              </Text>
            </div>
          )}
          {!record.validFrom && !record.validUntil && (
            <Text type="secondary">Vĩnh viễn</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 110,
      render: (active: boolean | undefined, record: DiscountCodePojo) => (
        <Switch
          checked={active}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
          onChange={(checked) => handleToggleActive(record.id!, checked)}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DiscountCodePojo) => (
        <Space size={4}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Xóa mã giảm giá?"
            description={`Xóa mã "${record.code}"?`}
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
        <Title level={3} style={{ margin: 0 }}>Quản lý mã giảm giá</Title>
        <Text type="secondary">Tạo, sửa và quản lý các mã khuyến mãi</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm mã giảm giá..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(v) => setQueryParams((prev) => ({ ...prev, code: v || undefined, page: 1 }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Loại"
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: 'Phần trăm', value: 'PERCENT' },
                { label: 'Số tiền', value: 'FIXED' },
              ]}
              onChange={(v) => setQueryParams((prev) => ({ ...prev, type: v, page: 1 }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: 'Đang hoạt động', value: 'true' },
                { label: 'Đã tắt', value: 'false' },
              ]}
              onChange={(v) => setQueryParams((prev) => ({
                ...prev,
                active: v !== undefined ? v === 'true' : undefined,
                page: 1,
              }))}
            />
          </Col>
          <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm mã giảm giá
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
        scroll={{ x: 1000 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} mã`,
          onChange: handleTableChange,
        }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingDiscount ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingDiscount ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnHidden
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ active: true, type: 'PERCENT', value: 0 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="Mã giảm giá"
            rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
          >
            <Input
              placeholder="VD: SUMMER2024"
              disabled={!!editingDiscount}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Phần trăm (%)', value: 'PERCENT' },
                    { label: 'Số tiền cố định (VND)', value: 'FIXED' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder={form.getFieldValue('type') === 'PERCENT' ? 'VD: 10' : 'VD: 50000'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="maxUses" label="Số lần sử dụng tối đa">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxUsesPerCustomer" label="Số lần / khách">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Mặc định: 1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="minCartValue" label="Đơn hàng tối thiểu (VND)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="validFrom" label="Từ ngày">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validUntil" label="Đến ngày">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả mã giảm giá..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default DiscountListView