'use client'

import React, { useState } from 'react'
import { App, Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { useRouter } from 'next/navigation'
import { LockOutlined, LoginOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { authService } from '@/services/rest-api/app-api/auth/authService'
import { getErrorMessage } from '@/services/rest-api/app-api/error-handle'

const { Title, Text } = Typography

export default function LoginPage() {
  const { message: antdMessage } = App.useApp()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await authService.login(values)
      antdMessage.success('Đăng nhập thành công')
      router.push('/dashboard')
    } catch (error: unknown) {
      antdMessage.error(getErrorMessage(error) || 'Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #5856d6 0%, #a78bfa 100%)',
      }}
    >
      <Card
        style={{
          width: 460,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: 'none',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: '40px 36px' } }}
      >
        {/* Logo & Branding */}
        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #5856d6, #a78bfa)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ShopOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
              Mono Studio
            </Title>
            <Text type="secondary">Hệ thống quản trị e-commerce</Text>
          </div>
        </Space>

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#a0aec0' }} />}
              placeholder="Nhập tên đăng nhập"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#a0aec0' }} />}
              placeholder="Nhập mật khẩu"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<LoginOutlined />}
              style={{
                borderRadius: 10,
                height: 48,
                fontWeight: 600,
                fontSize: 16,
                background: 'linear-gradient(135deg, #5856d6, #a78bfa)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(88, 86, 214, 0.4)',
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
