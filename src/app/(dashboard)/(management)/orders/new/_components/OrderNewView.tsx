'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Form, Input, Select, Button, Table,
  Space, Divider, Row, Col, message, Breadcrumb, Spin,
  InputNumber, Alert, Steps, Descriptions, Tag,
} from 'antd'
import {
  ShoppingCartOutlined, UserOutlined, SendOutlined,
  PlusOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCustomers,
  type CustomerPojo,
} from '@/services/rest-api/app-api/customers/customer-service'
import {
  searchProducts,
  type ProductPojo,
} from '@/services/rest-api/app-api/products/product-service'
import { searchShippingMethods } from '@/services/rest-api/app-api/shipping/shipping-service'
import {
  createOrder,
  type OrderPojo,
  type OrderDetailPojo,
} from '@/services/rest-api/app-api/orders/order-service'

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

// ── Types ────────────────────────────────────────────────────────

interface LineItem {
  key: string
  productId: number
  productName: string
  productBarcode: string
  unitPrice: number
  quantity: number
}

// ── OrderNewView ─────────────────────────────────────────────────

const OrderNewView: React.FC = () => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Customer search
  const { data: customerData } = useAxiosSWR(
    customerSearch.length >= 2 ? [SWR_KEYS.CUSTOMER_LIST, customerSearch] : null,
    customerSearch.length >= 2
      ? async () => {
          const res = await searchCustomers({ name: customerSearch, page: 1, size: 20 })
          return res.data ?? []
        }
      : null,
  )

  // Product search
  const { data: productData } = useAxiosSWR(
    productSearch.length >= 2 ? ['products/search', productSearch] : null,
    productSearch.length >= 2
      ? async () => {
          const res = await searchProducts({ name: productSearch, page: 1, size: 20 })
          return res.data ?? []
        }
      : null,
  )

  // Shipping methods
  const { data: shippingMethods } = useAxiosSWR(
    [SWR_KEYS.SHIPPING_LIST, { page: 1, size: 100 }],
    async () => {
      const res = await searchShippingMethods({ page: 1, size: 100 })
      return res.data ?? []
    },
  )

  const customerOptions = (customerData ?? []).map((c: CustomerPojo) => ({
    label: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
    value: c.id!,
    desc: c.email,
  }))

  const shippingOptions = (shippingMethods ?? []).map((s: { id?: number; name?: string; baseFee?: number }) => ({
    label: `${s.name} (${formatVND(s.baseFee)})`,
    value: s.id!,
  }))

  // ── Line items management ─────────────────────────────────────

  const handleAddProduct = useCallback((product: ProductPojo) => {
    setLineItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id!)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id!
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [
        ...prev,
        {
          key: String(Date.now()),
          productId: product.id!,
          productName: product.name,
          productBarcode: product.barcode,
          unitPrice: product.price,
          quantity: 1,
        },
      ]
    })
    setProductSearch('')
  }, [])

  const handleRemoveItem = useCallback((key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const handleQuantityChange = useCallback((key: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: qty } : item)),
    )
  }, [])

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (lineItems.length === 0) {
      messageApi.error('Vui lòng thêm ít nhất một sản phẩm')
      return
    }

    setSubmitting(true)
    try {
      const details: OrderDetailPojo[] = lineItems.map((item) => ({
        product: { id: item.productId, name: item.productName, barcode: item.productBarcode, price: item.unitPrice },
        units: item.quantity,
        unitValue: item.unitPrice,
      }))

      const selectedCustomer = (customerData ?? []).find(
        (c: CustomerPojo) => c.id === values.customerId,
      )

      const payload: OrderPojo = {
        customerId: values.customerId as number,
        customer: selectedCustomer as CustomerPojo,
        customerName: [selectedCustomer?.firstName, selectedCustomer?.lastName]
          .filter(Boolean).join(' '),
        customerEmail: selectedCustomer?.email,
        recipientName: values.recipientName as string,
        recipientPhone: values.recipientPhone as string,
        recipientEmail: values.recipientEmail as string,
        shippingAddress: values.shippingAddress as string,
        shippingCity: values.shippingCity as string,
        shippingDistrict: values.shippingDistrict as string,
        shippingWard: values.shippingWard as string,
        shippingMethod: shippingOptions.find((s) => s.value === values.shippingMethodId)?.label,
        paymentType: values.paymentType as string,
        paymentStatus: values.paymentType === 'CASH' ? 'PAID' : 'PENDING',
        notes: values.notes as string,
        details,
      }

      await createOrder(payload)
      messageApi.success('Tạo đơn hàng thành công')
      router.push('/orders/list')
    } catch {
      messageApi.error('Tạo đơn hàng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Line items table ─────────────────────────────────────────

  const lineColumns: ColumnsType<LineItem> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: unknown, record: LineItem) => (
        <div>
          <Text strong>{record.productName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.productBarcode}</Text>
        </div>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right' as const,
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(v) => handleQuantityChange(record.key, v ?? 1)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Thành tiền',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: LineItem) => (
        <Text strong>{formatVND(record.unitPrice * record.quantity)}</Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: unknown, record: LineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      ),
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/orders/list')}>Quản lý</a> },
            { title: <a onClick={() => router.push('/orders/list')}>Đơn hàng</a> },
            { title: 'Tạo đơn hàng mới' },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0 }}>
          Tạo đơn hàng thủ công
        </Title>
        <Text type="secondary">Admin tạo đơn hàng cho khách hàng tại quầy hoặc qua điện thoại</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ paymentType: 'CASH' }}
      >
        <Row gutter={[16, 16]}>
          {/* ── Main form ── */}
          <Col xs={24} lg={16}>
            {/* Customer */}
            <Card
              title={
                <Space><UserOutlined /> Thông tin khách hàng</Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="customerId"
                    label="Khách hàng"
                    rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Tìm kiếm khách hàng..."
                      filterOption={false}
                      onSearch={(v) => setCustomerSearch(v)}
                      onFocus={() => {
                        if (!customerData && customerSearch === '') setCustomerSearch(' ')
                      }}
                      options={customerOptions}
                      notFoundContent={
                        customerSearch.length >= 2 && !customerData ? (
                          <Spin size="small" />
                        ) : customerSearch.length < 2 ? (
                          <Text type="secondary">Nhập ít nhất 2 ký tự để tìm...</Text>
                        ) : null
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="recipientName" label="Tên người nhận">
                    <Input placeholder="Nguyễn Văn A" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="recipientPhone" label="SĐT người nhận">
                    <Input placeholder="0901234567" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="recipientEmail" label="Email người nhận">
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Products */}
            <Card
              title={
                <Space><ShoppingCartOutlined /> Sản phẩm</Space>
              }
              style={{ marginBottom: 16 }}
            >
              {/* Search product */}
              <div style={{ marginBottom: 12 }}>
                <Input.Search
                  placeholder="Tìm sản phẩm theo tên..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onSearch={(v) => {
                    const product = (productData ?? []).find(
                      (p: ProductPojo) => p.name.toLowerCase().includes(v.toLowerCase()),
                    )
                    if (product) handleAddProduct(product)
                  }}
                />
                {(productData ?? []).length > 0 && (
                  <div style={{
                    border: '1px solid #d9d9d9', borderRadius: 6, marginTop: 8,
                    maxHeight: 200, overflowY: 'auto', background: '#fff',
                  }}>
                    {(productData ?? []).map((p: ProductPojo) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        style={{
                          padding: '8px 12px', cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                      >
                        <div>
                          <Text strong>{p.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{p.barcode}</Text>
                        </div>
                        <Text strong style={{ color: '#52c41a' }}>{formatVND(p.price)}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items table */}
              <Table
                dataSource={lineItems}
                rowKey="key"
                columns={lineColumns}
                pagination={false}
                size="middle"
                locale={{ emptyText: 'Chưa có sản phẩm nào — tìm và thêm sản phẩm ở trên' }}
                footer={() => (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Space size="large">
                      <Text type="secondary">Tổng cộng ({lineItems.length} sản phẩm)</Text>
                      <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                        {formatVND(subtotal)}
                      </Text>
                    </Space>
                  </div>
                )}
              />
            </Card>

            {/* Shipping */}
            <Card
              title="Địa chỉ giao hàng"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={12}>
                <Col xs={24}>
                  <Form.Item name="shippingAddress" label="Địa chỉ">
                    <Input placeholder="123 Đường ABC, Phường X" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="shippingCity" label="Tỉnh/Thành phố">
                    <Input placeholder="TP. Hồ Chí Minh" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="shippingDistrict" label="Quận/Huyện">
                    <Input placeholder="Quận 1" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="shippingMethodId" label="Phương thức vận chuyển">
                    <Select
                      placeholder="Chọn phương thức..."
                      options={shippingOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Notes */}
            <Card title="Ghi chú">
              <Form.Item name="notes" label="Ghi chú đơn hàng">
                <Input.TextArea rows={2} placeholder="Ghi chú nội bộ (không hiển thị cho khách)" />
              </Form.Item>
            </Card>
          </Col>

          {/* ── Right: Summary + submit ── */}
          <Col xs={24} lg={8}>
            <Card
              title="Tóm tắt đơn hàng"
              style={{ position: 'sticky', top: 80 }}
              extra={<Tag color="blue">Thủ công</Tag>}
              actions={[
                <Button
                  key="submit"
                  type="primary"
                  size="large"
                  block
                  loading={submitting}
                  onClick={() => form.submit()}
                  style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
                >
                  Tạo đơn hàng
                </Button>,
              ]}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Số sản phẩm">
                  {lineItems.reduce((sum, i) => sum + i.quantity, 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Tạm tính">{formatVND(subtotal)}</Descriptions.Item>
                <Descriptions.Item label="Giảm giá">—</Descriptions.Item>
                <Descriptions.Item label="Phí vận chuyển">
                  {shippingOptions.find((s) => s.value === form.getFieldValue('shippingMethodId'))?.label?.split(' (')[1] ?? '—'}
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Tổng cộng</Text>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {formatVND(subtotal)}
                </Text>
              </div>
            </Card>

            {/* Payment */}
            <Card title="Thanh toán" style={{ marginTop: 16 }}>
              <Form.Item name="paymentType" label="Phương thức thanh toán">
                <Select
                  options={[
                    { label: 'Tiền mặt', value: 'CASH' },
                    { label: 'Chuyển khoản', value: 'BANK_TRANSFER' },
                    { label: 'Quẹt thẻ', value: 'POS' },
                  ]}
                />
              </Form.Item>
              {lineItems.length === 0 && (
                <Alert
                  message="Chưa có sản phẩm"
                  description="Vui lòng thêm sản phẩm trước khi tạo đơn hàng."
                  type="warning"
                  showIcon
                />
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export default OrderNewView