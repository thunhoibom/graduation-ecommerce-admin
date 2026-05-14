'use client'

import React, { useEffect } from 'react'
import { Modal, Form, Input, message, Alert } from 'antd'
import { patchCustomer } from '@/services/rest-api/app-api/customers/customer-service'
import type { CustomerPojo } from '@/services/rest-api/app-api/customers/customer-service'

export interface CustomerEditModalProps {
  open: boolean
  onClose: () => void
  customerId: number
  customer: CustomerPojo | null
  onSaved: () => void | Promise<void>
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  open,
  onClose,
  customerId,
  customer,
  onSaved,
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = React.useState(false)

  useEffect(() => {
    if (open && customer) {
      form.setFieldsValue({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone1: customer.phone1,
        phone2: customer.phone2,
        idNumber: customer.idNumber,
      })
    }
  }, [open, customer, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await patchCustomer(customerId, {
        'person.firstName': values.firstName,
        'person.lastName': values.lastName,
        'person.email': values.email,
        'person.phone1': values.phone1 ?? '',
        'person.phone2': values.phone2 ?? '',
        'person.idNumber': values.idNumber ?? '',
      })
      message.success('Đã cập nhật khách hàng')
      await onSaved()
      onClose()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không thể cập nhật. Kiểm tra dữ liệu hoặc quyền thao tác.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Chỉnh sửa khách hàng"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      width={520}
    >
      <Alert
        type="warning"
        showIcon
        message="Đổi email có thể ảnh hưởng đến đăng nhập của khách."
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical">
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
        <Form.Item name="idNumber" label="CMND/CCCD">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CustomerEditModal
