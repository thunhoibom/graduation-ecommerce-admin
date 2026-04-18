'use client'

import React from 'react'
import { Layout, Menu, Spin, Alert } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UndoOutlined,
  TeamOutlined,
  GiftOutlined,
  GlobalOutlined,
  PictureOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { paths } from '@/routes/paths'

const { Sider } = Layout

interface AppSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

/**
 * Static e-commerce admin menu items
 */
const menuItems: MenuProps['items'] = [
  {
    key: paths.dashboard.root,
    icon: <DashboardOutlined />,
    label: <Link href={paths.dashboard.root}>Dashboard</Link>,
  },
  {
    key: 'products',
    icon: <ShoppingOutlined />,
    label: 'Sản phẩm',
    children: [
      {
        key: paths.products.list,
        icon: <AppstoreOutlined />,
        label: <Link href={paths.products.list}>Danh sách sản phẩm</Link>,
      },
      {
        key: paths.products.new,
        icon: <ShoppingOutlined />,
        label: <Link href={paths.products.new}>Thêm sản phẩm mới</Link>,
      },
    ],
  },
  {
    key: 'categories',
    icon: <AppstoreOutlined />,
    label: <Link href={paths.categories.list}>Danh mục sản phẩm</Link>,
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: 'Đơn hàng',
    children: [
      {
        key: paths.orders.list,
        icon: <ShoppingCartOutlined />,
        label: <Link href={paths.orders.list}>Danh sách đơn hàng</Link>,
      },
    ],
  },
  {
    key: 'returns',
    icon: <UndoOutlined />,
    label: 'Trả hàng / Hoàn tiền',
    children: [
      {
        key: paths.returns.list,
        icon: <UndoOutlined />,
        label: <Link href={paths.returns.list}>Danh sách yêu cầu</Link>,
      },
    ],
  },
  {
    key: 'customers',
    icon: <TeamOutlined />,
    label: <Link href={paths.customers.list}>Khách hàng</Link>,
  },
  {
    key: 'discounts',
    icon: <GiftOutlined />,
    label: 'Mã giảm giá',
    children: [
      {
        key: paths.discounts.list,
        icon: <GiftOutlined />,
        label: <Link href={paths.discounts.list}>Danh sách mã</Link>,
      },
      {
        key: paths.discounts.new,
        icon: <GiftOutlined />,
        label: <Link href={paths.discounts.new}>Thêm mã mới</Link>,
      },
    ],
  },
  {
    key: 'shipping',
    icon: <GlobalOutlined />,
    label: <Link href={paths.shipping.list}>Phương thức vận chuyển</Link>,
  },
  {
    key: 'media',
    icon: <PictureOutlined />,
    label: <Link href={paths.media.list}>Thư viện media</Link>,
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: <Link href={paths.settings.root}>Cài đặt</Link>,
  },
]

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname()
  const rootSubmenuKey = '/' + pathname.split('/')[1]

  return (
    <Sider
      breakpoint="lg"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      collapsedWidth={80}
      theme="light"
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: '1px solid #f0f0f0',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          margin: 16,
          background: 'linear-gradient(135deg, #5856d6, #a78bfa)',
          color: 'white',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 15,
          letterSpacing: '0.5px',
        }}
      >
        {collapsed ? (
          <span>MS</span>
        ) : (
          <span>Mono Studio</span>
        )}
      </div>

      <Menu
        inlineCollapsed={collapsed}
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={[rootSubmenuKey]}
        items={menuItems}
        style={{
          height: 'calc(100vh - 96px)',
          overflow: 'auto',
          borderRight: 'none',
        }}
      />
    </Sider>
  )
}

export default AppSidebar
