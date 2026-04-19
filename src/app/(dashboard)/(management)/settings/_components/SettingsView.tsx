'use client'

import React, { useState, useCallback } from 'react'
import {
  Card, Typography, Tabs, Table, Form, Input, Switch,
  Button, Space, Tag, Popconfirm, message, Breadcrumb,
  Spin, Tooltip, Divider,
} from 'antd'
import {
  SaveOutlined, ReloadOutlined, ShopOutlined,
  CreditCardOutlined, SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getParamsByCategory,
  updateParam,
  type ParamPojo,
} from '@/services/rest-api/app-api/settings/settings-service'

type PageResponse<T> = {
  success: boolean
  message?: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

const { Title, Text } = Typography

const CATEGORIES = [
  { key: 'shop', label: 'Cửa hàng', icon: <ShopOutlined /> },
  { key: 'payment', label: 'Thanh toán', icon: <CreditCardOutlined /> },
  { key: 'system', label: 'Hệ thống', icon: <SettingOutlined /> },
]

// ── Single param editable row ───────────────────────────────────

interface EditableParamRowProps {
  record: ParamPojo
  onSave: (id: number, data: ParamPojo) => Promise<void>
}

const EditableParamRow: React.FC<EditableParamRowProps> = ({ record, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const handleStart = () => {
    form.setFieldsValue({ value: record.value })
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await onSave(record.id!, { ...record, value: values.value })
      setEditing(false)
    } catch {
      // validation error shown by form
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ display: 'block', fontSize: 13 }}>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
            {record.value || <span style={{ fontStyle: 'italic' }}>— trống —</span>}
          </Text>
        </div>
        <Button type="link" size="small" onClick={handleStart}>
          Sửa
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Form form={form} style={{ flex: 1 }}>
        <Form.Item
          name="value"
          style={{ marginBottom: 0 }}
          rules={[{ required: true, message: 'Giá trị không được trống' }]}
        >
          <Input.TextArea
            rows={1}
            placeholder={record.value || 'Nhập giá trị...'}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      </Form>
      <Space size={4}>
        <Button type="primary" size="small" loading={saving} onClick={handleSave} icon={<SaveOutlined />}>
          Lưu
        </Button>
        <Button size="small" onClick={handleCancel}>Hủy</Button>
      </Space>
    </div>
  )
}

// ── Category tab pane ────────────────────────────────────────────

interface CategoryTabProps {
  category: string
  label: string
}

const CategoryTab: React.FC<CategoryTabProps> = ({ category, label }) => {
  const [messageApi, contextHolder] = message.useMessage()

  const { data, isLoading, mutate } = useAxiosSWR<PageResponse<ParamPojo[]>>(
    [SWR_KEYS.PARAMS_BY_CATEGORY, category],
    async () => getParamsByCategory(category),
    { revalidateOnMount: true },
  )

  const params = data?.data ?? []

  const handleSave = useCallback(async (id: number, updated: ParamPojo) => {
    try {
      await updateParam(id, updated)
      messageApi.success('Cập nhật thành công')
      mutate()
    } catch {
      messageApi.error('Cập nhật thất bại. Vui lòng thử lại.')
    }
  }, [mutate, messageApi])

  return (
    <>
      {contextHolder}
      <Spin spinning={isLoading}>
        <div style={{ minHeight: 200 }}>
          {params.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Text type="secondary">Chưa có tham số nào cho mục "{label}"</Text>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {params.map((param) => (
                <EditableParamRow
                  key={param.id}
                  record={param}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}
        </div>
      </Spin>
    </>
  )
}

// ── SettingsView ─────────────────────────────────────────────────

const SettingsView: React.FC = () => {
  return (
    <>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[{ title: 'Quản lý' }, { title: 'Cài đặt' }]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0 }}>Cài đặt hệ thống</Title>
        <Text type="secondary">
          Quản lý tham số cấu hình cho cửa hàng, thanh toán và hệ thống
        </Text>
      </div>

      {/* Info card */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            💡 Nhấn <Text code>Tab</Text> hoặc <Text code>Enter</Text> để chỉnh sửa giá trị. Nhấn
            <Text code>Esc</Text> để hủy.
          </Text>
        </Space>
      </Card>

      {/* Tabs */}
      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="shop"
          tabBarStyle={{ paddingLeft: 16, marginBottom: 0 }}
          items={CATEGORIES.map((cat) => ({
            key: cat.key,
            label: (
              <span>
                {cat.icon} {cat.label}
              </span>
            ),
            children: (
              <div style={{ padding: '16px 16px 8px' }}>
                <CategoryTab category={cat.key} label={cat.label} />
              </div>
            ),
          }))}
        />
      </Card>
    </>
  )
}

export default SettingsView
