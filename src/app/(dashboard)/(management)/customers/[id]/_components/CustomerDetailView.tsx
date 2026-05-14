'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Descriptions, Table, Button, Space,
  Divider, Spin, Breadcrumb, Row, Col, Statistic, Tag,
  Drawer, message, Alert, Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined, MailOutlined, PhoneOutlined, HomeOutlined,
  ShoppingOutlined, DollarOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getCustomerDetail,
  deleteCustomer,
  type CustomerPojo,
  type AddressPojo,
  type CustomerOrderPojo,
} from '@/services/rest-api/app-api/customers/customer-service'
import { FULFILLMENT_STATUS_CONFIG, normalizeOrderStatus } from '@/constants/order-status'
import { getErrorMessage } from '@/services/rest-api/app-api/error-handle'
import CustomerEditModal from './CustomerEditModal'

const { Title, Text } = Typography

const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (d: string | undefined) =>
  d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'

// ── CustomerDetailView ───────────────────────────────────────────

interface CustomerDetailViewProps {
  customerId: number
}

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customerId }) => {
  const router = useRouter()
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: customer, isLoading, mutate } = useAxiosSWR<CustomerPojo>(
    [SWR_KEYS.CUSTOMER_DETAIL, customerId],
    async () => getCustomerDetail(customerId),
    { revalidateOnMount: true },
  )

  const orders = customer?.orders ?? []
  const addresses = customer?.addresses ?? []

  const handleDeleted = async () => {
    try {
      setDeleting(true)
      await deleteCustomer(customerId)
      message.success('Đã xóa khách hàng')
      router.push('/customers')
    } catch (err) {
      message.error(getErrorMessage(err) || 'Không thể xóa khách hàng.')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">Không tìm thấy khách hàng</Text>
      </div>
    )
  }

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'

  const orderColumns: ColumnsType<CustomerOrderPojo> = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <Text strong style={{ color: '#1677ff' }}>{formatVND(v)}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const key = normalizeOrderStatus(status)
        const cfg = FULFILLMENT_STATUS_CONFIG[key] ?? { color: 'default', label: status ?? '—' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (s: string) => {
        const color = s === 'PAID' ? 'green' : s === 'UNPAID' ? 'red' : 'default'
        return <Tag color={color}>{s ?? '—'}</Tag>
      },
    },
    {
      title: 'Số SP',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 80,
      align: 'center' as const,
      render: (v: number) => v ?? '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CustomerOrderPojo) => (
        <Button
          type="text"
          size="small"
          onClick={() => router.push(`/orders/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  const addressColumns: ColumnsType<AddressPojo> = [
    {
      title: 'Nhãn',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      render: (l: string) => l || '—',
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      render: (n: string) => n || '—',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (p: string) => p || '—',
    },
    {
      title: 'Địa chỉ',
      key: 'address',
      ellipsis: true,
      render: (_: unknown, record: AddressPojo) => {
        const parts = [record.address1, record.address2, record.ward, record.district, record.city].filter(Boolean)
        return parts.join(', ') || '—'
      },
    },
    {
      title: 'Mặc định',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 90,
      align: 'center' as const,
      render: (v: boolean) => v ? <Tag color="green">Mặc định</Tag> : null,
    },
  ]

  return (
    <>
      <CustomerEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customerId={customerId}
        customer={customer}
        onSaved={() => mutate()}
      />

      <Drawer
        title={`Địa chỉ giao hàng — ${fullName}`}
        open={addressDrawerOpen}
        onClose={() => setAddressDrawerOpen(false)}
        width={600}
      >
        {addresses.length > 0 ? (
          <Table
            dataSource={addresses}
            rowKey={(r) => String(r.id ?? `${r.label}-${r.address1}`)}
            columns={addressColumns}
            pagination={false}
            size="middle"
            scroll={{ x: 550 }}
          />
        ) : (
          <Alert type="info" message="Khách hàng chưa có địa chỉ giao hàng nào." />
        )}
      </Drawer>

      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/customers')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/customers')}>Khách hàng</a> },
            { title: fullName },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/customers')}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0, flex: 1 }}>
            Khách hàng #{customerId}
          </Title>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa khách hàng?"
            description="Chỉ khách không có đơn và không có tài khoản đăng nhập mới xóa được."
            onConfirm={handleDeleted}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="Thông tin cá nhân" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Họ">{customer.firstName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tên">{customer.lastName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {customer.email ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT chính">{customer.phone1 ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="SĐT phụ">{customer.phone2 ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="CMND/CCCD">{customer.idNumber ?? '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Lịch sử đơn hàng" style={{ marginBottom: 16 }}>
            {orders.length > 0 ? (
              <Table
                dataSource={orders}
                rowKey="id"
                columns={orderColumns}
                pagination={{ pageSize: 5, size: 'small' }}
                size="middle"
                scroll={{ x: 700 }}
              />
            ) : (
              <Alert
                type="info"
                message="Khách hàng chưa có đơn hàng nào."
                showIcon
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="Thống kê" style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Statistic
                  title="Số đơn hàng"
                  value={customer.orderCount ?? 0}
                  prefix={<ShoppingOutlined />}
                  styles={{ content: { color: '#1677ff' } }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tổng chi tiêu"
                  value={customer.totalSpent ?? 0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatVND(Number(value))}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Liên hệ nhanh" style={{ marginBottom: 16 }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              {customer.email && (
                <Button
                  block
                  icon={<MailOutlined />}
                  href={`mailto:${customer.email}`}
                  style={{ textAlign: 'left' }}
                >
                  {customer.email}
                </Button>
              )}
              {customer.phone1 && (
                <Button
                  block
                  icon={<PhoneOutlined />}
                  href={`tel:${customer.phone1}`}
                  style={{ textAlign: 'left' }}
                >
                  {customer.phone1}
                </Button>
              )}
            </Space>
          </Card>

          <Card
            title="Địa chỉ giao hàng"
            style={{ marginBottom: 16 }}
            extra={
              <Button
                type="link"
                size="small"
                icon={<HomeOutlined />}
                onClick={() => setAddressDrawerOpen(true)}
              >
                Xem tất cả
              </Button>
            }
          >
            {addresses.length > 0 ? (
              <Space orientation="vertical" style={{ width: '100%' }}>
                {addresses.slice(0, 3).map((addr) => (
                  <Card key={addr.id ?? `${addr.label}-${addr.address1}`} size="small" style={{ background: '#fafafa' }}>
                    {addr.label && (
                      <Tag color="blue" style={{ marginBottom: 4 }}>{addr.label}</Tag>
                    )}
                    <Text style={{ display: 'block' }}>{addr.name ?? '—'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {addr.phone ?? ''}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {[addr.address1, addr.district, addr.city].filter(Boolean).join(', ') || '—'}
                    </Text>
                  </Card>
                ))}
              </Space>
            ) : (
              <Alert type="info" message="Chưa có địa chỉ giao hàng." showIcon />
            )}
          </Card>

          <Card title="Thông tin hệ thống">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">
                <Text code>#{customerId}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default CustomerDetailView
