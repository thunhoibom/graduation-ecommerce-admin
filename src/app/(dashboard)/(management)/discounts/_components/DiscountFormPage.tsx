'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Typography, Form, Input, Select, InputNumber,
  DatePicker, Switch, Row, Col, Button, Space,
  message, Breadcrumb, Divider,
} from 'antd'
import {
  SaveOutlined, ArrowLeftOutlined, CopyOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getDiscountById,
  createDiscount,
  updateDiscount,
  type DiscountCodePojo,
  type DiscountFormData,
} from '@/services/rest-api/app-api/discounts/discount-service'

const { Title, Text } = Typography

const TYPE_OPTIONS = [
  { label: 'Phần trăm (%)', value: 'PERCENT' },
  { label: 'Số tiền cố định (VND)', value: 'FIXED' },
]

interface DiscountFormPageProps {
  discountId?: string
}

const DiscountFormPage: React.FC<DiscountFormPageProps> = ({ discountId }) => {
  const router = useRouter()
  const isEditMode = Boolean(discountId)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Load discount if editing
  const { data: discountData, isLoading } = useAxiosSWR<DiscountCodePojo>(
    isEditMode ? [SWR_KEYS.DISCOUNT_DETAIL, discountId] : null,
    isEditMode ? async () => getDiscountById(Number(discountId)) : null,
    { revalidateOnMount: true },
  )

  useEffect(() => {
    if (discountData && isEditMode) {
      form.setFieldsValue({
        code: discountData.code,
        description: discountData.description,
        type: discountData.type,
        value: discountData.value,
        maxUses: discountData.maxUses,
        maxUsesPerCustomer: discountData.maxUsesPerCustomer,
        minCartValue: discountData.minCartValue,
        validFrom: discountData.validFrom ? dayjs(discountData.validFrom) : null,
        validUntil: discountData.validUntil ? dayjs(discountData.validUntil) : null,
        active: discountData.active !== false,
      })
    }
  }, [discountData, isEditMode, form])

  const handleGenerateCode = () => {
    setGenerating(true)
    const prefixes = ['SUMMER', 'FLASH', 'NEW', 'VIP', 'SALE', 'WEEKEND']
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const code = `${prefix}${suffix}`
    form.setFieldValue('code', code)
    setGenerating(false)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: DiscountFormData = {
        ...(isEditMode && discountData ? { id: discountData.id } : {}),
        code: (values.code as string).toUpperCase().trim(),
        description: values.description as string | undefined,
        type: values.type as 'PERCENT' | 'FIXED',
        value: Number(values.value),
        maxUses: values.maxUses ? Number(values.maxUses) : undefined,
        maxUsesPerCustomer: values.maxUsesPerCustomer ? Number(values.maxUsesPerCustomer) : undefined,
        minCartValue: values.minCartValue ? Number(values.minCartValue) : undefined,
        validFrom: values.validFrom
          ? (values.validFrom as dayjs.Dayjs).startOf('day').toISOString()
          : undefined,
        validUntil: values.validUntil
          ? (values.validUntil as dayjs.Dayjs).endOf('day').toISOString()
          : undefined,
        active: values.active as boolean,
      }

      if (isEditMode) {
        await updateDiscount(Number(discountId), payload)
        messageApi.success('Cập nhật mã giảm giá thành công')
      } else {
        await createDiscount(payload)
        messageApi.success('Tạo mã giảm giá thành công')
      }
      router.push('/discounts/list')
    } catch {
      messageApi.error('Thao tác thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <Link href="/discounts/list">Mã giảm giá</Link> },
            { title: isEditMode ? 'Sửa mã' : 'Thêm mã mới' },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0 }}>
          {isEditMode ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
        </Title>
        <Text type="secondary">
          {isEditMode ? 'Cập nhật thông tin mã khuyến mãi' : 'Tạo mã giảm giá mới cho khách hàng'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'PERCENT',
          value: 0,
          active: true,
          maxUsesPerCustomer: 1,
        }}
      >
        <Row gutter={[24, 0]}>
          {/* ── Left: Main fields ── */}
          <Col xs={24} lg={16}>
            <Card title="Thông tin mã giảm giá" style={{ marginBottom: 16 }}>
              <Form.Item
                name="code"
                label="Mã giảm giá"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã' },
                  { min: 3, message: 'Mã phải có ít nhất 3 ký tự' },
                ]}
              >
                <Input
                  placeholder="VD: SUMMER2024"
                  disabled={isEditMode}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 16, letterSpacing: 1 }}
                  maxLength={30}
                  suffix={
                    !isEditMode && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        loading={generating}
                        onClick={handleGenerateCode}
                        title="Tạo mã ngẫu nhiên"
                      >
                        Tạo mã
                      </Button>
                    )
                  }
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Loại giảm giá"
                    rules={[{ required: true }]}
                  >
                    <Select options={TYPE_OPTIONS} />
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
                      placeholder={
                        form.getFieldValue('type') === 'PERCENT' ? 'VD: 10 (≤ 100)' : 'VD: 50000'
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="maxUses" label="Số lần sử dụng tối đa">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="0 = Không giới hạn"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxUsesPerCustomer" label="Số lần / mỗi khách">
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Mặc định: 1"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="minCartValue" label="Giá trị đơn hàng tối thiểu (VND)">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="0 = Không yêu cầu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="validFrom" label="Ngày bắt đầu">
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="Để trống = bắt đầu ngay"
                      showTime={false}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="validUntil" label="Ngày kết thúc">
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="Để trống = vĩnh viễn"
                      showTime={false}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="Mô tả (nội bộ)">
                <Input.TextArea
                  rows={2}
                  placeholder="Mô tả ngắn gọn về mã giảm giá (không hiển thị cho khách)"
                  maxLength={255}
                  showCount
                />
              </Form.Item>
            </Card>
          </Col>

          {/* ── Right: Preview + actions ── */}
          <Col xs={24} lg={8}>
            <Card
              title="Xem trước"
              style={{ marginBottom: 16, background: '#fafafa' }}
              bodyStyle={{ padding: 16 }}
            >
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const code = form.getFieldValue('code') || 'CODE'
                  const type = form.getFieldValue('type') || 'PERCENT'
                  const value = form.getFieldValue('value') || 0
                  const active = form.getFieldValue('active') !== false

                  const displayValue = type === 'PERCENT'
                    ? `${value}%`
                    : new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0,
                      }).format(value)

                  return (
                    <div
                      style={{
                        border: '2px dashed #5856d6',
                        borderRadius: 12,
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: '#fff',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                          color: active ? '#5856d6' : '#999',
                          display: 'block',
                        }}
                      >
                        {code.toUpperCase()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: active ? '#52c41a' : '#999',
                          display: 'block',
                          margin: '8px 0',
                        }}
                      >
                        -{displayValue}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: 'block' }}
                      >
                        {active ? '✓ Còn hiệu lực' : '✗ Đã tắt'}
                      </Text>
                    </div>
                  )
                }}
              </Form.Item>
            </Card>

            {/* Quick templates */}
            <Card title="Mẫu nhanh" size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({ type: 'PERCENT', value: 10, maxUses: 100 })
                    form.setFieldValue('validUntil', dayjs().add(7, 'day'))
                  }}
                >
                  Giảm 10% · 7 ngày
                </Button>
                <Button
                  block
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({ type: 'FIXED', value: 50000, maxUses: 50 })
                    form.setFieldValue('validUntil', dayjs().add(30, 'day'))
                  }}
                >
                  Giảm 50.000đ · 30 ngày
                </Button>
                <Button
                  block
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({ type: 'PERCENT', value: 15, maxUses: undefined })
                  }}
                >
                  Giảm 15% · Không giới hạn
                </Button>
                <Button
                  block
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({ type: 'FIXED', value: 100000, minCartValue: 500000, maxUses: 200 })
                  }}
                >
                  Giảm 100.000đ · Đơn từ 500.000đ
                </Button>
              </Space>
            </Card>

            {/* Actions */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                block
                style={{ backgroundColor: '#5856d6', borderColor: '#5856d6', height: 44 }}
              >
                {isEditMode ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
              </Button>
              <Link href="/discounts/list" style={{ width: '100%' }}>
                <Button icon={<ArrowLeftOutlined />} block>
                  Quay lại danh sách
                </Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export default DiscountFormPage
