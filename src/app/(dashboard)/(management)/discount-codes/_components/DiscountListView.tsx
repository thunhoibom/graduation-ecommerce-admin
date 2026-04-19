'use client'

import React, { useState, useCallback } from 'react'
import {
  Table, Card, Typography, Row, Col, Button, Input, Select,
  Tag, Space, message, Popconfirm, Modal, Form, InputNumber,
  DatePicker, Switch, Divider, Tooltip,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  StopOutlined, CheckCircleOutlined, CopyOutlined,
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
  type DiscountFormData,
  type DiscountType,
} from '@/services/rest-api/app-api/discounts/discount-service'
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

const formatDate = (d: string | undefined) =>
  d ? dayjs(d).format('DD/MM/YYYY') : '—'

const TYPE_OPTIONS = [
  { label: 'Phần trăm (%)', value: 'PERCENT' },
  { label: 'Số tiền cố định (VND)', value: 'FIXED' },
]

const STATUS_OPTIONS = [
  { label: 'Đang hoạt động', value: true },
  { label: 'Đã vô hiệu hóa', value: false },
]

// ── DiscountListView ────────────────────────────────────────────

const DiscountListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<DiscountSearchParams>>({
    page: 1,
    size: 20,
  })
  const [form] = Form.useForm<DiscountFormData>()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

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

  const handleFilter = useCallback((key: string, value: unknown) => {
    setQueryParams((prev) => ({ ...prev, [key]: value ?? undefined, page: 1 }))
  }, [])

  const openCreateModal = () => {
    setEditId(null)
    form.resetFields()
    form.setFieldsValue({ active: true })
    setModalOpen(true)
  }

  const openEditModal = (record: DiscountCodePojo) => {
    setEditId(record.id ?? null)
    form.setFieldsValue({
      code: record.code,
      description: record.description,
      type: record.type,
      value: record.value,
      maxUses: record.maxUses,
      maxUsesPerCustomer: record.maxUsesPerCustomer,
      minCartValue: record.minCartValue,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      active: record.active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload = {
        ...values,
        validFrom: values.validFrom ? dayjs(values.validFrom).format('YYYY-MM-DD') : undefined,
        validUntil: values.validUntil ? dayjs(values.validUntil).format('YYYY-MM-DD') : undefined,
      } as DiscountFormData

      if (editId) {
        await updateDiscount(editId, payload)
        messageApi.success('Cập nhật mã giảm giá thành công')
      } else {
        await createDiscount(payload)
        messageApi.success('Tạo mã giảm giá thành công')
      }
      setModalOpen(false)
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (record: DiscountCodePojo) => {
    try {
      await toggleDiscountActive(record.id!, !record.active)
      messageApi.success(record.active ? 'Đã vô hiệu hóa mã' : 'Đã kích hoạt mã')
      mutate()
    } catch {
      messageApi.error('Thao tác thất bại')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDiscount(id)
      messageApi.success('Xóa mã giảm giá thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    messageApi.success('Đã copy mã giảm giá')
  }

  const columns: ColumnsType<DiscountCodePojo> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {code}
        </Text>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (d: string) => d || <Text type="secondary">—</Text>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      align: 'center' as const,
      render: (t: DiscountType) => (
        <Tag color={t === 'PERCENT' ? 'blue' : 'purple'}>
          {t === 'PERCENT' ? '% (Phần trăm)' : 'VND (Cố định)'}
        </Tag>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      align: 'right' as const,
      render: (v: number, record: DiscountCodePojo) => (
        <Text strong style={{ color: '#52c41a' }}>
          {record.type === 'PERCENT'
            ? `${v}%`
            : formatVND(v)}
        </Text>
      ),
    },
    {
      title: 'Số lần dùng',
      key: 'usage',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: DiscountCodePojo) => {
        const used = record.useCount ?? 0
        const max = record.maxUses
        const remaining = record.remainingUses ?? (max ? max - used : null)
        return (
          <Space orientation="vertical" size={0} style={{ textAlign: 'center' }}>
            <Text>{used}{max ? `/${max}` : ''}</Text>
            {remaining !== null && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Còn {remaining}
              </Text>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Giá trị đơn tối thiểu',
      dataIndex: 'minCartValue',
      key: 'minCartValue',
      width: 140,
      align: 'right' as const,
      render: (v: number) => v ? formatVND(v) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Hết hạn',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 120,
      render: (d: string) => {
        if (!d) return <Text type="secondary">—</Text>
        const expiry = dayjs(d)
        const isExpired = expiry.isBefore(dayjs(), 'day')
        return (
          <Text type={isExpired ? 'danger' : 'secondary'}>
            {formatDate(d)}
          </Text>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 110,
      align: 'center' as const,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: DiscountCodePojo) => (
        <Space size={4}>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.active ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button
              type="text"
              icon={record.active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleActive(record)}
              style={{ color: record.active ? '#ff4d4f' : '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Copy mã">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyCode(record.code)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa mã giảm giá?"
            description={`Xóa mã "${record.code}". Hành động không thể hoàn tác.`}
            onConfirm={() => handleDelete(record.id!)}
            okText="Xóa"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Create/Edit Modal */}
      <Modal
        title={editId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editId ? 'Lưu thay đổi' : 'Tạo mã'}
        confirmLoading={saving}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã giảm giá"
                rules={[{ required: true, message: 'Nhập mã giảm giá' }]}
              >
                <Input placeholder="SUMMER50" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Loại giảm giá" rules={[{ required: true }]}>
                <Select options={TYPE_OPTIONS} placeholder="Chọn loại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Giá trị giảm"
                rules={[{ required: true, message: 'Nhập giá trị' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="50"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu hóa" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn..." />
          </Form.Item>

          <Divider plain style={{ margin: '12px 0' }}>Giới hạn sử dụng</Divider>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="maxUses" label="Số lần dùng tối đa">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxUsesPerCustomer" label="Mỗi khách hàng tối đa">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="maxUsesPerCustomer" label="Mỗi khách hàng tối đa">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minCartValue" label="Giá trị đơn tối thiểu (VND)">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="validFrom" label="Ngày bắt đầu">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validUntil" label="Ngày hết hạn">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Mã giảm giá</Title>
          <Text type="secondary">Quản lý mã giảm giá, coupon, khuyến mãi</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Tạo mã mới
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={16} md={8}>
            <Input.Search
              placeholder="Tìm mã, mô tả..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(v) => setQueryParams((prev) => ({
                ...prev,
                code: v || undefined,
                page: 1,
              }))}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Loại giảm giá"
              allowClear
              style={{ width: '100%' }}
              options={TYPE_OPTIONS}
              onChange={(v) => handleFilter('type', v)}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
              onChange={(v) => handleFilter('active', v)}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} mã giảm giá`,
          onChange: handleTableChange,
        }}
      />
    </>
  )
}

export default DiscountListView