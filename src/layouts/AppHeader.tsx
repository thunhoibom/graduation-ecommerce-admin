'use client'

import React, { useEffect, useState } from 'react'
import { Layout, Space, Avatar, Dropdown, Typography, Badge } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { authService, UserInfo } from '@/services/rest-api/app-api/auth/authService'

const { Header } = Layout
const { Text } = Typography

interface AppHeaderProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const AppHeader: React.FC<AppHeaderProps> = ({ collapsed, setCollapsed }) => {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    setUser(authService.getUserInfo())
  }, [])

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
        <Badge count={0} size="small" offset={[-2, 2]}>
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
  )
}

export default AppHeader