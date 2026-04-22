'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import type { MenuProps } from 'antd'
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
import Link from 'next/link'
import { paths } from '@/routes/paths'

interface MenuContextType {
  menus: unknown[]
  menuItems: MenuProps['items']
  isLoading: boolean
  error: Error | null
  hasAccess: (menuCode: string) => boolean
  hasPrivilege: (menuCode: string, privilege: string) => boolean
  refresh: () => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

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

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Static menu — no API call needed
  const value: MenuContextType = {
    menus: [],
    menuItems,
    isLoading: false,
    error: null,
    hasAccess: () => true,
    hasPrivilege: () => true,
    refresh: () => {},
  }

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}
