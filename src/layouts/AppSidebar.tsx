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
  UserOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  NodeIndexOutlined,
  GlobalOutlined,
  InboxOutlined,
  ShopOutlined,
  AuditOutlined,
  ReadOutlined,
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
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: 'Đơn hàng',
    children: [
      {
        key: paths.orders.list,
        icon: <ShoppingCartOutlined />,
        label: <Link href={paths.orders.list}>Danh sách đơn hàng</Link>,
      },
      {
        key: paths.returns.list,
        icon: <UndoOutlined />,
        label: <Link href={paths.returns.list}>Trả hàng / Hoàn tiền</Link>,
      },
    ],
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
        key: paths.categories.list,
        icon: <AppstoreOutlined />,
        label: <Link href={paths.categories.list}>Danh mục sản phẩm</Link>,
      },
    ],
  },
  {
    key: 'blog',
    icon: <ReadOutlined />,
    label: <Link href={paths.blog.list}>Blog</Link>,
  },
  {
    key: 'customers',
    icon: <TeamOutlined />,
    label: <Link href={paths.customers.list}>Khách hàng</Link>,
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: 'Người dùng',
    children: [
      {
        key: paths.users.list,
        icon: <UserOutlined />,
        label: <Link href={paths.users.list}>Tài khoản</Link>,
      },
      {
        key: paths.users.roles,
        icon: <SafetyCertificateOutlined />,
        label: <Link href={paths.users.roles}>Vai trò & quyền</Link>,
      },
    ],
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
        key: paths.discounts.rules,
        icon: <NodeIndexOutlined />,
        label: <Link href={paths.discounts.rules}>Quy tắc khuyến mãi</Link>,
      },
    ],
  },
  {
    key: 'shipping',
    icon: <GlobalOutlined />,
    label: <Link href={paths.shipping.list}>Phương thức vận chuyển</Link>,
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: 'Tồn kho',
    children: [
      {
        key: paths.inventory.stockAdjustments,
        icon: <InboxOutlined />,
        label: <Link href={paths.inventory.stockAdjustments}>Điều chỉnh tồn</Link>,
      },
      {
        key: paths.inventory.suppliers,
        icon: <ShopOutlined />,
        label: <Link href={paths.inventory.suppliers}>Nhà cung cấp</Link>,
      },
      {
        key: paths.inventory.purchaseOrders,
        icon: <ShoppingCartOutlined />,
        label: <Link href={paths.inventory.purchaseOrders}>Đơn đặt hàng mua</Link>,
      },
      {
        key: paths.inventory.stockCounts,
        icon: <AuditOutlined />,
        label: <Link href={paths.inventory.stockCounts}>Kiểm kê định kỳ</Link>,
      },
    ],
  },
  {
    key: paths.settings.root,
    icon: <SettingOutlined />,
    label: <Link href={paths.settings.root}>Cài đặt hệ thống</Link>,
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
