'use client'

import React, { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import localeData from 'dayjs/plugin/localeData'
import AppTable from '@/shared/components/antd/AppTable'
import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import {
  createPromotionRule,
  deletePromotionRule,
  listPromotionRules,
  updatePromotionRule,
  type PromotionRuleActionType,
  type PromotionConditionOperator,
  type PromotionRulePojo,
  type PromotionRuleScope,
} from '@/services/rest-api/app-api/promotions/promotion-rule-service'
import { searchCategories, type CategoryPojo } from '@/services/rest-api/app-api/categories/category-service'
import { searchProducts, type ProductPojo } from '@/services/rest-api/app-api/products/product-service'

dayjs.extend(weekday)
dayjs.extend(localeData)

const { Title, Text } = Typography

const FACT_FIELD_OPTIONS = [
  { label: 'Tạm tính giỏ hàng', value: 'cart.subtotal' },
  { label: 'Số dòng sản phẩm trong giỏ', value: 'cart.line_count' },
  { label: 'Tổng số lượng sản phẩm', value: 'cart.total_units' },
  { label: 'Giỏ có ít nhất một sản phẩm (barcode)', value: 'cart.has_any_product' },
  { label: 'Giỏ có ít nhất một danh mục', value: 'cart.has_any_category' },
  { label: 'Hạng thành viên', value: 'user.tier' },
  { label: 'Chi tiêu tháng của khách', value: 'user.monthly_spend' },
  { label: 'Giờ trong ngày', value: 'env.hour_of_day' },
  { label: 'Có phải ngày lễ', value: 'env.is_holiday' },
]

const OPERATOR_OPTIONS: { label: string; value: PromotionConditionOperator }[] = [
  { label: 'Bằng', value: 'EQ' },
  { label: 'Khác', value: 'NE' },
  { label: 'Lớn hơn', value: 'GT' },
  { label: 'Lớn hơn hoặc bằng', value: 'GTE' },
  { label: 'Nhỏ hơn', value: 'LT' },
  { label: 'Nhỏ hơn hoặc bằng', value: 'LTE' },
  { label: 'Thuộc danh sách', value: 'IN' },
]

const ACTION_TYPE_OPTIONS: { label: string; value: PromotionRuleActionType }[] = [
  { label: 'Giảm theo phần trăm', value: 'PERCENTAGE_DISCOUNT' },
  { label: 'Giảm số tiền cố định', value: 'FIXED_DISCOUNT' },
  { label: 'Miễn phí vận chuyển', value: 'FREE_SHIPPING' },
]

const SCOPE_OPTIONS: { label: string; value: PromotionRuleScope }[] = [
  { label: 'Sản phẩm', value: 'PRODUCT' },
  { label: 'Danh mục', value: 'CATEGORY' },
  { label: 'Giỏ hàng', value: 'CART' },
  { label: 'Vận chuyển', value: 'SHIPPING' },
]

const CATALOG_SCOPE_OPTIONS: { label: string; value: PromotionRuleScope }[] = [
  { label: 'Sản phẩm', value: 'PRODUCT' },
  { label: 'Danh mục', value: 'CATEGORY' },
]

const CHECKOUT_SCOPE_OPTIONS: { label: string; value: PromotionRuleScope }[] = [
  { label: 'Giỏ hàng', value: 'CART' },
  { label: 'Vận chuyển', value: 'SHIPPING' },
]

const CATALOG_FACT_FIELD_OPTIONS = [
  { label: 'Sản phẩm', value: 'cart.has_any_product' },
  { label: 'Danh mục', value: 'cart.has_any_category' },
]

const CHECKOUT_FACT_FIELD_OPTIONS = FACT_FIELD_OPTIONS.filter(
  (item) => item.value !== 'cart.has_any_product' && item.value !== 'cart.has_any_category',
)

const CATALOG_OPERATOR_OPTIONS: { label: string; value: PromotionConditionOperator }[] = [
  { label: 'Thuộc danh sách', value: 'IN' },
]

type RuleFormValues = {
  name: string
  priority: number
  combinable: boolean
  active: boolean
  scope: PromotionRuleScope
  activeFrom?: dayjs.Dayjs
  activeUntil?: dayjs.Dayjs
  mutualExclusionGroup?: string
  conditions: Array<{
    factField: string
    operator: PromotionConditionOperator
    targetValue: string | string[]
  }>
  actions: Array<{
    actionType: PromotionRuleActionType
    value: number
  }>
}

const PromotionRulesView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [modalKind, setModalKind] = useState<'catalog' | 'checkout' | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [form] = Form.useForm<RuleFormValues>()
  const conditions = Form.useWatch('conditions', form) ?? []

  const { data, isLoading, mutate } = useAxiosSWR<PromotionRulePojo[]>(
    SWR_KEYS.PROMOTION_RULE_LIST,
    async () => listPromotionRules(),
    { revalidateOnMount: true },
  )
  const { data: categoriesResponse } = useAxiosSWR<{ items: CategoryPojo[] }>(
    SWR_KEYS.CATEGORY_LIST,
    async () => searchCategories({ pageSize: 500 }),
    { revalidateOnMount: true },
  )
  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.items ?? []).map((category) => ({
        label: `${category.name} (${category.code})`,
        value: String(category.id),
      })),
    [categoriesResponse?.items],
  )
  const { data: productsResponse } = useAxiosSWR<{ items: ProductPojo[] }>(
    SWR_KEYS.PRODUCT_LIST,
    async () => searchProducts({ pageSize: 500 }),
    { revalidateOnMount: true },
  )
  const productOptions = useMemo(
    () =>
      (productsResponse?.items ?? []).map((product) => ({
        label: `${product.name} (${product.barcode})`,
        value: product.barcode,
      })),
    [productsResponse?.items],
  )

  const openCreateCatalog = () => {
    setEditingRuleId(null)
    form.resetFields()
    form.setFieldsValue({
      priority: 0,
      active: true,
      combinable: true,
      scope: 'PRODUCT',
      conditions: [{ factField: 'cart.has_any_product', operator: 'IN', targetValue: '' }],
      actions: [{ actionType: 'PERCENTAGE_DISCOUNT', value: 10 }],
    })
    setModalKind('catalog')
  }

  const openCreateCheckout = () => {
    setEditingRuleId(null)
    form.resetFields()
    form.setFieldsValue({
      priority: 0,
      active: true,
      combinable: true,
      scope: 'CART',
      conditions: [{ factField: 'cart.subtotal', operator: 'GTE', targetValue: '0' }],
      actions: [{ actionType: 'PERCENTAGE_DISCOUNT', value: 10 }],
    })
    setModalKind('checkout')
  }

  const openEdit = (rule: PromotionRulePojo) => {
    setEditingRuleId(rule.id ?? null)
    form.resetFields()
    form.setFieldsValue({
      name: rule.name,
      priority: rule.priority,
      active: rule.active,
      combinable: rule.combinable,
      scope: rule.scope ?? 'CART',
      activeFrom: rule.activeFrom ? dayjs(rule.activeFrom) : undefined,
      activeUntil: rule.activeUntil ? dayjs(rule.activeUntil) : undefined,
      mutualExclusionGroup: rule.mutualExclusionGroup,
      conditions:
        rule.conditions?.map((condition) => ({
          factField: condition.factField,
          operator: condition.operator,
          targetValue:
            condition.factField === 'cart.has_any_category' || condition.factField === 'cart.has_any_product'
              ? condition.targetValue
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              : condition.targetValue,
        })) ?? [{ factField: 'cart.subtotal', operator: 'GTE', targetValue: '0' }],
      actions:
        rule.actions?.map((action) => ({
          actionType: action.actionType,
          value: action.value,
        })) ?? [{ actionType: 'PERCENTAGE_DISCOUNT', value: 10 }],
    })
    const scope = rule.scope ?? 'CART'
    setModalKind(scope === 'PRODUCT' || scope === 'CATEGORY' ? 'catalog' : 'checkout')
  }

  const closeModal = () => {
    setModalKind(null)
    setEditingRuleId(null)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const hasFreeShipping = values.actions.some((a) => a.actionType === 'FREE_SHIPPING')
      const hasPriceDiscount = values.actions.some((a) => a.actionType !== 'FREE_SHIPPING')
      if ((values.scope === 'PRODUCT' || values.scope === 'CATEGORY') && hasFreeShipping) {
        messageApi.error('Rule scope PRODUCT/CATEGORY không hỗ trợ FREE_SHIPPING')
        return
      }
      if (values.scope === 'SHIPPING' && hasPriceDiscount) {
        messageApi.error('Rule scope SHIPPING chỉ nên dùng FREE_SHIPPING')
        return
      }
      setSaving(true)
      const payload: PromotionRulePojo = {
        name: values.name,
        priority: values.priority,
        combinable: values.combinable,
        active: values.active,
        scope: values.scope,
        activeFrom: values.activeFrom ? values.activeFrom.toISOString() : undefined,
        activeUntil: values.activeUntil ? values.activeUntil.toISOString() : undefined,
        mutualExclusionGroup: values.mutualExclusionGroup || undefined,
        conditions: values.conditions.map((c) => ({
          factField: c.factField,
          operator: c.operator,
          targetValue:
            (c.factField === 'cart.has_any_category' || c.factField === 'cart.has_any_product') &&
            Array.isArray(c.targetValue)
              ? c.targetValue.join(',')
              : String(c.targetValue ?? ''),
        })),
        actions: values.actions.map((a) => ({
          actionType: a.actionType,
          value: a.value ?? 0,
        })),
      }
      if (editingRuleId) {
        await updatePromotionRule(editingRuleId, payload)
        messageApi.success('Cập nhật quy tắc khuyến mãi thành công')
      } else {
        await createPromotionRule(payload)
        messageApi.success('Tạo quy tắc khuyến mãi thành công')
      }
      closeModal()
      mutate()
    } catch {
      messageApi.error(editingRuleId ? 'Không thể cập nhật quy tắc khuyến mãi' : 'Không thể tạo quy tắc khuyến mãi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    try {
      await deletePromotionRule(id)
      messageApi.success('Đã xóa quy tắc')
      mutate()
    } catch {
      messageApi.error('Xóa quy tắc thất bại')
    }
  }

  const columns: ColumnsType<PromotionRulePojo> = [
    {
      title: 'Quy tắc',
      key: 'name',
      dataIndex: 'name',
      render: (name: string, row) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            #{row.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      width: 120,
      align: 'center',
      render: (scope?: PromotionRuleScope) => {
        const safeScope = scope ?? 'CART'
        const color =
          safeScope === 'PRODUCT' || safeScope === 'CATEGORY'
            ? 'purple'
            : safeScope === 'SHIPPING'
              ? 'cyan'
              : 'blue'
        return <Tag color={color}>{safeScope}</Tag>
      },
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      width: 100,
      align: 'center',
    },
    {
      title: 'Điều kiện',
      key: 'conditions',
      render: (_, row) => (
        <Text>{row.conditions?.length ?? 0} điều kiện</Text>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, row) => (
        <Space wrap>
          {(row.actions ?? []).map((a, idx) => (
            <Tag key={`${row.id}-a-${idx}`} color={a.actionType === 'FREE_SHIPPING' ? 'cyan' : 'blue'}>
              {a.actionType}:{a.value}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Kết hợp',
      key: 'stack',
      width: 130,
      render: (_, row) => (
        <Space orientation="vertical" size={0}>
          <Tag color={row.combinable ? 'green' : 'default'}>
            {row.combinable ? 'Cộng dồn' : 'Loại trừ'}
          </Tag>
          {row.mutualExclusionGroup ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Nhóm: {row.mutualExclusionGroup}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'active',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Tag color={row.active ? 'green' : 'default'}>{row.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions_col',
      width: 140,
      align: 'center',
      render: (_, row) => (
        <Space size={0}>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title="Xóa quy tắc này?"
            description="Hành động không thể hoàn tác."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(row.id)}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const isCatalogModal = modalKind === 'catalog'
  const scopeOptions = isCatalogModal ? CATALOG_SCOPE_OPTIONS : CHECKOUT_SCOPE_OPTIONS
  const factFieldOptions = isCatalogModal ? CATALOG_FACT_FIELD_OPTIONS : CHECKOUT_FACT_FIELD_OPTIONS
  const operatorOptions = isCatalogModal ? CATALOG_OPERATOR_OPTIONS : OPERATOR_OPTIONS

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Trình quản lý quy tắc khuyến mãi</Title>
          <Text type="secondary">Cấu hình điều kiện và hành động khuyến mãi</Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={openCreateCatalog}>
            Thêm rule Catalog
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCheckout}>
            Thêm rule Checkout
          </Button>
        </Space>
      </div>

      <Card>
        <AppTable
          rowKey="id"
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={
          editingRuleId
            ? `Chỉnh sửa quy tắc ${isCatalogModal ? 'Catalog' : 'Checkout'}`
            : `Tạo quy tắc ${isCatalogModal ? 'Catalog' : 'Checkout'}`
        }
        open={modalKind !== null}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={920}
        okText={editingRuleId ? 'Lưu thay đổi' : 'Tạo'}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Tên quy tắc" rules={[{ required: true, message: 'Nhập tên quy tắc' }]}>
                <Input placeholder="Giảm 10% cho Gold" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="scope" label="Scope" rules={[{ required: true, message: 'Chọn scope' }]}>
                <Select options={scopeOptions} placeholder="Chọn scope" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="mutualExclusionGroup" label="Nhóm loại trừ">
                <Input placeholder="FLASH_SALE" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="combinable" label="Cho phép cộng dồn" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="activeFrom" label="Hiệu lực từ">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="activeUntil" label="Hiệu lực đến">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="Điều kiện" style={{ marginBottom: 12 }}>
            <Form.List name="conditions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row gutter={8} key={field.key} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'factField']}
                          rules={[{ required: true }]}
                        >
                          <Select options={factFieldOptions} placeholder="Trường dữ kiện" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'operator']}
                          rules={[{ required: true }]}
                        >
                          <Select options={operatorOptions} placeholder="Toán tử" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        {conditions?.[field.name]?.factField === 'cart.has_any_category' ? (
                          <Form.Item
                            {...field}
                            name={[field.name, 'targetValue']}
                            rules={[{ required: true, message: 'Chọn ít nhất 1 danh mục' }]}
                            getValueProps={(value) => {
                              if (Array.isArray(value)) {
                                return { value }
                              }
                              if (typeof value === 'string' && value.trim().length > 0) {
                                return {
                                  value: value
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                }
                              }
                              return { value: [] as string[] }
                            }}
                          >
                            <Select
                              mode="multiple"
                              options={categoryOptions}
                              placeholder="Chọn danh mục"
                              optionFilterProp="label"
                              showSearch
                            />
                          </Form.Item>
                        ) : conditions?.[field.name]?.factField === 'cart.has_any_product' ? (
                          <Form.Item
                            {...field}
                            name={[field.name, 'targetValue']}
                            rules={[{ required: true, message: 'Chọn ít nhất 1 sản phẩm' }]}
                            getValueProps={(value) => {
                              if (Array.isArray(value)) {
                                return { value }
                              }
                              if (typeof value === 'string' && value.trim().length > 0) {
                                return {
                                  value: value
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                }
                              }
                              return { value: [] as string[] }
                            }}
                          >
                            <Select
                              mode="multiple"
                              options={productOptions}
                              placeholder="Chọn sản phẩm"
                              optionFilterProp="label"
                              showSearch
                            />
                          </Form.Item>
                        ) : (
                          <Form.Item
                            {...field}
                            name={[field.name, 'targetValue']}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="Giá trị mục tiêu" />
                          </Form.Item>
                        )}
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                    Thêm Condition
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          <Card size="small" title="Hành động">
            <Form.List name="actions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row gutter={8} key={field.key} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'actionType']}
                          rules={[{ required: true }]}
                        >
                          <Select options={ACTION_TYPE_OPTIONS} placeholder="Loại hành động" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'value']}
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} placeholder="Giá trị" />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                    Thêm Action
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>
    </>
  )
}

export default PromotionRulesView

