'use client'

import React, { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { createCustomer } from '@/services/rest-api/app-api/customers/customer-service'

export interface CustomerCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void | Promise<void>
}

const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const payload: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone1: values.phone1 ?? '',
        phone2: values.phone2 ?? '',
      }
      if (values.idNumber?.trim()) {
        payload.idNumber = values.idNumber.trim()
      }
      await createCustomer(payload)
      message.success('Đã tạo khách hàng')
      await onCreated()
      form.resetFields()
      onClose()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không thể tạo khách hàng. Kiểm tra trùng email/CMND hoặc quyền ghi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm khách hàng"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={{ phone1: '', phone2: '' }}>
        <Form.Item name="firstName" label="Họ" rules={[{ required: true, message: 'Nhập họ' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Email hợp lệ' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone1" label="SĐT chính">
          <Input />
        </Form.Item>
        <Form.Item name="phone2" label="SĐT phụ">
          <Input />
        </Form.Item>
        <Form.Item
          name="idNumber"
          label="CMND/CCCD"
          extra="Bắt buộc nếu hệ thống dùng để tránh trùng; có thể để trống cho guest (hệ thống tự sinh mã)."
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CustomerCreateModal
