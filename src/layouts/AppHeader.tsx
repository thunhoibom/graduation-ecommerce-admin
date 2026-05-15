'use client'

import React, { useEffect, useState } from 'react'
import { Layout, Space, Avatar, Dropdown, Typography, Badge, message, Popover, Empty, Button } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { authService, UserInfo } from '@/services/rest-api/app-api/auth/authService'
import { useAdminNotificationStream } from '@/shared/hooks/use-admin-notification-stream'

const { Header } = Layout
const { Text } = Typography

interface AppHeaderProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const AppHeader: React.FC<AppHeaderProps> = ({ collapsed, setCollapsed }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const pathname = usePathname()
  const router = useRouter()
  const { notifications, unreadCount, resetUnreadCount } = useAdminNotificationStream({
    onNewOrder: (payload) => {
      messageApi.info(`Đơn hàng mới #${payload.orderCode} vừa được tạo`)
    },
  })

  useEffect(() => {
    setUser(authService.getUserInfo())
  }, [])

  useEffect(() => {
    if (pathname?.startsWith('/orders')) {
      resetUnreadCount()
    }
  }, [pathname, resetUnreadCount])

  const handleOpenNotifications = (open: boolean) => {
    setIsNotificationOpen(open)
    if (open) {
      resetUnreadCount()
    }
  }

  const formatReceivedTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Vừa xong'
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const notificationContent = (
    <div style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có thông báo mới"
          style={{ margin: '16px 0' }}
        />
      ) : (
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          {notifications.map((item) => (
            <Button
              key={item.payload.eventId || `${item.payload.orderId}-${item.receivedAt}`}
              type="text"
              onClick={() => {
                router.push(`/orders/${item.payload.orderId}`)
                setIsNotificationOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                height: 'auto',
                padding: 10,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: item.read ? '#fff' : '#f6ffed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.payload.previewImageUrl ? (
                      <img
                        src={item.payload.previewImageUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <ShoppingCartOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <Text strong style={{ color: '#262626' }}>
                      Đơn hàng mới #{item.payload.orderCode}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatReceivedTime(item.receivedAt)} - Tổng tiền: {item.payload.totalAmount?.toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                </div>
            </Button>
          ))}
        </Space>
      )}
    </div>
  )

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      authService.logout()
    }
  }

  const userMenuItems = {
    items: [
      {
        key: 'logout',
        label: 'Đăng xuất',
        icon: <LogoutOutlined />,
      },
    ],
    onClick: handleMenuClick,
  }

  return (
    <>
      {contextHolder}
      <Header
        style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 18,
            padding: '0 16px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>

        <Space size={20}>
          <Popover
            trigger="click"
            placement="bottomRight"
            open={isNotificationOpen}
            onOpenChange={handleOpenNotifications}
            content={notificationContent}
          >
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <span
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                <BellOutlined />
              </span>
            </Badge>
          </Popover>

          <Dropdown menu={userMenuItems} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
              <Avatar
                style={{
                  background: 'linear-gradient(135deg, #5856d6, #a78bfa)',
                  flexShrink: 0,
                }}
                icon={<UserOutlined />}
              />
              <div style={{ lineHeight: 1.3 }}>
                <Text strong style={{ fontSize: 14, display: 'block' }}>
                  {user?.username || 'Admin'}
                </Text>
                {user?.roles && user.roles.length > 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user.roles[0]}
                  </Text>
                )}
              </div>
            </Space>
          </Dropdown>
        </Space>
      </Header>
    </>
  )
}

export default AppHeader