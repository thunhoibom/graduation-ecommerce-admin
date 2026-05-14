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
    pageIndex: 0,
    pageSize: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethodPojo | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, mutate } = useAxiosSWR<{
    rows: ShippingMethodPojo[]
    totalCount: number
  }>(
    [SWR_KEYS.SHIPPING_LIST, queryParams],
    async () => {
      const res = await searchShippingMethods(queryParams as ShippingSearchParams)
      return {
        rows: res.items ?? [],
        totalCount: res.totalCount ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({
      ...prev,
      pageIndex: Math.max(0, page - 1),
      pageSize: size,
    }))
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQueryParams((prev) => ({
      ...prev,
      nameLike: value.trim() || undefined,
      name: undefined,
      pageIndex: 0,
    }))
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
      pricePerKm: record.pricePerKm,
      carrierCode: record.carrierCode ?? 'LOCAL',
      rateMode: record.rateMode ?? 'DISTANCE',
      carrierServiceCode: record.carrierServiceCode,
      carrierShopId: record.carrierShopId,
    })
    setFormOpen(true)
  }

  const handleDelete = useCallback(async (id: number) => {
    if (id == null || !Number.isFinite(Number(id))) {
      messageApi.error('Không xác định được phương thức cần xóa — tải lại trang.')
      return
    }
    try {
      await deleteShippingMethod(id)
      messageApi.success('Xóa phương thức thành công')
      mutate()
    } catch {
      messageApi.error('Xóa thất bại')
    }
  }, [mutate, messageApi])

  const handleToggleActive = useCallback(async (record: ShippingMethodPojo) => {
    const id = record.id
    if (id == null) return
    const nextActive = !(record.active ?? false)
    try {
      await updateShippingMethod(id, { ...record, active: nextActive })
      messageApi.success(nextActive ? 'Đã bật phương thức' : 'Đã tắt phương thức')
      mutate()
    } catch {
      messageApi.error('Không cập nhật được trạng thái')
      mutate()
    }
  }, [mutate, messageApi])

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const toInt = (v: unknown, fallback = 0) => {
        const n = Number(v)
        return Number.isFinite(n) ? Math.trunc(n) : fallback
      }
      const rawName = typeof values.name === 'string' ? values.name.trim() : ''
      const payload: ShippingMethodPojo = {
        name: rawName,
        baseFee: toInt(values.baseFee, 0),
        freeShippingThreshold: values.freeShippingThreshold
          ? toInt(values.freeShippingThreshold, 0)
          : undefined,
        estimatedDaysMin: toInt(values.estimatedDaysMin, 0),
        estimatedDaysMax: toInt(values.estimatedDaysMax, 0),
        active: values.active !== undefined && values.active !== null ? Boolean(values.active) : true,
        pricePerKm: values.pricePerKm ? toInt(values.pricePerKm, 0) : undefined,
        carrierCode: (values.carrierCode as string) || 'LOCAL',
        rateMode: (values.rateMode as string) || 'DISTANCE',
        carrierServiceCode: values.carrierServiceCode as string | undefined,
        carrierShopId: values.carrierShopId ? toInt(values.carrierShopId, 0) : undefined,
      }

      if (editingMethod) {
        const editId = editingMethod.id
        if (editId == null || !Number.isFinite(Number(editId))) {
          messageApi.error('Thiếu mã phương thức — tải lại trang và thử lại.')
          return
        }
        await updateShippingMethod(editId, payload)
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
          checked={Boolean(active)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
          onChange={() => {
            void handleToggleActive(record)
          }}
        />
      ),
    },
    {
      title: 'Carrier',
      dataIndex: 'carrierCode',
      key: 'carrierCode',
      width: 100,
      render: (v?: string) => <Tag color={v === 'GHN' ? 'blue' : 'default'}>{v ?? 'LOCAL'}</Tag>,
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
            onConfirm={() => {
              const rid = record.id
              if (rid == null || !Number.isFinite(Number(rid))) {
                messageApi.error('Không xác định được phương thức — tải lại trang.')
                return
              }
              void handleDelete(rid)
            }}
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
        dataSource={data?.rows ?? []}
        loading={isLoading}
        scroll={{ x: 700 }}
        pagination={{
          current: (queryParams.pageIndex ?? 0) + 1,
          pageSize: queryParams.pageSize ?? 20,
          total: data?.totalCount ?? 0,
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
        destroyOnHidden
        width={540}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ active: true, estimatedDaysMin: 1, estimatedDaysMax: 5, carrierCode: 'LOCAL', rateMode: 'DISTANCE' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên phương thức"
          >
            <Input placeholder="VD: Giao hàng tiêu chuẩn (để trống = tên mặc định)" />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="baseFee"
                label="Phí cơ bản (VND)"
              >
                <Input type="number" min={0} placeholder="VD: 30000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pricePerKm"
                label="Phí/km (nếu có)"
              >
                <Input type="number" min={0} placeholder="VD: 3000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="carrierCode"
                label="Carrier code"
              >
                <Input placeholder="LOCAL hoặc GHN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rateMode"
                label="Rate mode"
              >
                <Input placeholder="STATIC / DISTANCE / LIVE_API" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="carrierServiceCode"
                label="GHN service ID"
              >
                <Input placeholder="VD: 53320" />
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
                name="carrierShopId"
                label="GHN shop ID"
              >
                <Input type="number" min={0} placeholder="VD: 123456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={12}>
              <Form.Item
                name="estimatedDaysMin"
                label="Ngày giao tối thiểu"
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedDaysMax"
                label="Ngày giao tối đa"
              >
                <Input type="number" min={0} />
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
