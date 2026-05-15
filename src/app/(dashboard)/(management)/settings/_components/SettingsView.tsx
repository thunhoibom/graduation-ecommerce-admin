'use client'

import React, { useCallback, useState } from 'react'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Image,
  Input,
  Row,
  Space,
  Spin,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd'
import {
  CreditCardOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  getParamsByCategory,
  updateParam,
  type ParamPojo,
} from '@/services/rest-api/app-api/settings/settings-service'
import { uploadImage, type ImagePojo } from '@/services/rest-api/app-api/media/media-service'

const { Title, Text } = Typography

const CATEGORIES = [
  {
    key: 'company',
    label: 'Cửa hàng',
    icon: <ShopOutlined />,
    description: 'Thông tin hiển thị trên storefront và trang giới thiệu cửa hàng.',
  },
  {
    key: 'payment',
    label: 'Thanh toán',
    icon: <CreditCardOutlined />,
    description: 'Tham số cấu hình phương thức thanh toán và thời gian chờ thanh toán.',
  },
  {
    key: 'system',
    label: 'Hệ thống',
    icon: <SettingOutlined />,
    description: 'Thông tin hỗ trợ và các cờ vận hành hệ thống.',
  },
] as const

const PARAM_DISPLAY_LABELS: Record<string, Record<string, string>> = {
  company: {
    name: 'Tên cửa hàng',
    description: 'Mô tả cửa hàng',
    bannerImageURL: 'Ảnh banner',
    logoImageURL: 'Logo cửa hàng',
  },
  payment: {
    cod_enabled: 'Bật COD',
    payos_enabled: 'Bật PayOS',
    payment_timeout_minutes: 'Thời gian hết hạn thanh toán (phút)',
  },
  system: {
    support_email: 'Email hỗ trợ',
    support_phone: 'Hotline hỗ trợ',
    maintenance_mode: 'Chế độ bảo trì',
  },
}

const getParamLabel = (record: ParamPojo) =>
  PARAM_DISPLAY_LABELS[record.category]?.[record.name] ?? record.name

const isImageUrlParam = (record: ParamPojo) => /imageurl$/i.test(record.name)

const buildImageFileList = (record: ParamPojo, value?: string): UploadFile[] => {
  const url = value?.trim()
  if (!url) return []

  return [{
    uid: `${record.id ?? record.name}`,
    name: url.split('/').pop() ?? record.name,
    status: 'done',
    url,
  }]
}

interface EditableParamRowProps {
  record: ParamPojo
  onSave: (id: number, data: ParamPojo) => Promise<void>
}

const EditableParamRow: React.FC<EditableParamRowProps> = ({ record, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const imageParam = isImageUrlParam(record)
  const label = getParamLabel(record)

  const handleStart = () => {
    form.setFieldsValue({ value: record.value })
    setFileList(buildImageFileList(record, record.value))
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setFileList([])
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await uploadImage(file as File)
      onSuccess?.(result)
    } catch (err) {
      onError?.(err as Error)
      messageApi.error('Upload ảnh thất bại')
    }
  }

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    setFileList(nextFileList)

    const uploaded = nextFileList.find((file) => file.status === 'done')
    const uploadedUrl = (uploaded?.response as ImagePojo | undefined)?.url ?? uploaded?.url
    if (uploadedUrl) {
      form.setFieldsValue({ value: uploadedUrl })
      return
    }

    if (nextFileList.length === 0) {
      form.setFieldsValue({ value: '' })
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await onSave(record.id!, { ...record, value: values.value })
      setEditing(false)
      setFileList([])
    } catch {
      // validation error shown by form
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Card
        size="small"
        variant="borderless"
        style={{
          height: '100%',
          background: editing ? '#fafafa' : '#fff',
          border: '1px solid #f0f0f0',
        }}
        styles={{ body: { padding: 16 } }}
      >
        <Flex vertical gap={12} style={{ height: '100%' }}>
          <Flex justify="space-between" align="flex-start" gap={12} wrap="wrap">
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text strong style={{ display: 'block', fontSize: 14 }}>
                {label}
              </Text>
              <Text type="secondary" code style={{ fontSize: 12 }}>
                {record.name}
              </Text>
            </div>
            {!editing ? (
              <Button type="default" size="small" icon={<EditOutlined />} onClick={handleStart}>
                Sửa
              </Button>
            ) : null}
          </Flex>

          {!editing ? (
            <div style={{ minHeight: imageParam ? 120 : undefined }}>
              {imageParam && record.value ? (
                <Image
                  src={record.value}
                  alt={label}
                  style={{
                    maxWidth: record.name === 'logoImageURL' ? 120 : '100%',
                    maxHeight: record.name === 'logoImageURL' ? 120 : 180,
                    borderRadius: 8,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Text
                  type={record.value ? undefined : 'secondary'}
                  style={{
                    display: 'block',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {record.value || 'Chưa cấu hình'}
                </Text>
              )}
            </div>
          ) : (
            <Form form={form} layout="vertical" style={{ width: '100%' }}>
              {imageParam ? (
                <>
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    customRequest={handleUpload}
                    onChange={handleUploadChange}
                    maxCount={1}
                    accept="image/*"
                  >
                    {fileList.length >= 1 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                      </div>
                    )}
                  </Upload>
                  <Form.Item
                    name="value"
                    hidden
                    rules={[{ required: true, message: 'Vui lòng tải ảnh' }]}
                  >
                    <Input />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  name="value"
                  label="Giá trị"
                  rules={[{ required: true, message: 'Giá trị không được trống' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea
                    rows={imageParam ? 2 : 3}
                    placeholder={record.value || 'Nhập giá trị...'}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </Form.Item>
              )}
            </Form>
          )}

          {editing ? (
            <Flex justify="flex-end" gap={8} wrap="wrap">
              <Button size="small" onClick={handleCancel}>
                Hủy
              </Button>
              <Button
                type="primary"
                size="small"
                loading={saving}
                onClick={handleSave}
                icon={<SaveOutlined />}
              >
                Lưu
              </Button>
            </Flex>
          ) : null}
        </Flex>
      </Card>
    </>
  )
}

interface CategoryTabProps {
  category: string
  label: string
  description: string
}

const CategoryTab: React.FC<CategoryTabProps> = ({ category, label, description }) => {
  const [messageApi, contextHolder] = message.useMessage()

  const { data, isLoading, error, mutate } = useAxiosSWR<ParamPojo[]>(
    [SWR_KEYS.PARAMS_BY_CATEGORY, category],
    async () => getParamsByCategory(category),
    { revalidateOnMount: true },
  )

  const params = data ?? []

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
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Text type="secondary">{description}</Text>

        {error ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải tham số cấu hình"
            description="Kiểm tra quyền params:read hoặc kết nối tới backend."
          />
        ) : null}

        <Spin spinning={isLoading}>
          {params.length === 0 && !isLoading ? (
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">Chưa có tham số nào cho mục &quot;{label}&quot;.</Text>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {params.map((param) => (
                <Col
                  key={param.id}
                  xs={24}
                  md={isImageUrlParam(param) ? 24 : 12}
                  xl={isImageUrlParam(param) ? 12 : 8}
                >
                  <EditableParamRow record={param} onSave={handleSave} />
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Space>
    </>
  )
}

const SettingsView: React.FC = () => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Breadcrumb
          items={[{ title: 'Quản lý' }, { title: 'Cài đặt' }]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0 }}>
          Cài đặt hệ thống
        </Title>
        <Text type="secondary">
          Quản lý tham số cấu hình cho cửa hàng, thanh toán và hệ thống
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        message="Cách cập nhật"
        description="Chọn tab, bấm Sửa, cập nhật giá trị rồi Lưu. Thay đổi áp dụng ngay sau khi lưu thành công."
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          defaultActiveKey="company"
          tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
          items={CATEGORIES.map((cat) => ({
            key: cat.key,
            label: (
              <Space size={8}>
                {cat.icon}
                <span>{cat.label}</span>
              </Space>
            ),
            children: (
              <div style={{ padding: 16 }}>
                <CategoryTab
                  category={cat.key}
                  label={cat.label}
                  description={cat.description}
                />
              </div>
            ),
          }))}
        />
      </Card>
    </Space>
  )
}

export default SettingsView
