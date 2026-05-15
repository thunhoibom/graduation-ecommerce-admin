'use client'

import React, { useEffect, useState } from 'react'
import { Form, Input, Modal, Select, message } from 'antd'
import {
  createUser,
  patchUser,
  type UserPojo,
} from '@/services/rest-api/app-api/users/user-service'

export type UserFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  user?: UserPojo | null
  roleOptions: Array<{ label: string; value: string }>
  onClose: () => void
  onSaved: () => void | Promise<void>
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  user,
  roleOptions,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && user) {
      form.setFieldsValue({
        name: user.name,
        role: user.role,
        email: user.person?.email,
        firstName: user.person?.firstName,
        lastName: user.person?.lastName,
        phone1: user.person?.phone1,
        idNumber: user.person?.idNumber,
      })
      return
    }
    form.resetFields()
  }, [form, mode, open, user])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (mode === 'create') {
        const payload: UserPojo = {
          name: values.name.trim(),
          password: values.password,
          role: values.role,
        }
        if (values.idNumber?.trim() || values.email?.trim()) {
          payload.person = {
            email: values.email?.trim() || `${values.name.trim()}@local.invalid`,
            firstName: values.firstName?.trim(),
            lastName: values.lastName?.trim(),
            phone1: values.phone1?.trim(),
            idNumber: values.idNumber?.trim(),
          }
        }
        await createUser(payload)
        message.success('Đã tạo tài khoản')
      } else if (user?.id) {
        const patchBody: Record<string, unknown> = {
          name: values.name.trim(),
          role: values.role,
        }
        if (values.password?.trim()) {
          patchBody.password = values.password.trim()
        }
        await patchUser(user.id, patchBody)
        message.success('Đã cập nhật tài khoản')
      }

      await onSaved()
      form.resetFields()
      onClose()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      message.error(mode === 'create' ? 'Không thể tạo tài khoản' : 'Không thể cập nhật tài khoản')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={mode === 'create' ? 'Thêm tài khoản' : `Sửa tài khoản ${user?.name ?? ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên đăng nhập"
          rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}
        >
          <Input disabled={mode === 'edit'} />
        </Form.Item>
        <Form.Item
          name="password"
          label={mode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới'}
          rules={mode === 'create' ? [{ required: true, message: 'Nhập mật khẩu' }, { min: 6, message: 'Ít nhất 6 ký tự' }] : [{ min: 6, message: 'Ít nhất 6 ký tự' }]}
        >
          <Input.Password placeholder={mode === 'edit' ? 'Để trống nếu không đổi' : undefined} />
        </Form.Item>
        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: 'Chọn vai trò' }]}
        >
          <Select options={roleOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        {mode === 'create' ? (
          <>
            <Form.Item name="firstName" label="Họ">
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Tên">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email hồ sơ">
              <Input />
            </Form.Item>
            <Form.Item name="phone1" label="Số điện thoại">
              <Input />
            </Form.Item>
            <Form.Item
              name="idNumber"
              label="CMND/CCCD"
              extra="Nhập nếu cần liên kết với hồ sơ Person đã có trong hệ thống."
            >
              <Input />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  )
}

export default UserFormModal
