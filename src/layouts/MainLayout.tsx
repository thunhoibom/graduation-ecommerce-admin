'use client'

import React from 'react'
import { Layout } from 'antd'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { BreadcrumbProvider } from '@/shared/contexts/BreadcrumbContext'
import { SidebarProvider, useSidebar } from '@/shared/contexts/SidebarContext'
import { MenuProvider } from '@/shared/contexts/MenuContext'
import AppBreadcrumb from '@/shared/components/breadcrumb/AppBreadcrumb'

const { Content, Footer } = Layout

interface MainLayoutProps {
    children: React.ReactNode
}

const LayoutContent: React.FC<MainLayoutProps> = ({ children }) => {
    const { collapsed, setCollapsed } = useSidebar()
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 250,
                    transition: 'all 0.2s',
                }}
            >
                <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} />
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: '#fff',
                        borderRadius: 8,
                    }}
                >
                    <AppBreadcrumb />
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Mono Studio Admin ©{new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    )
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <BreadcrumbProvider>
                <MenuProvider>
                    <LayoutContent>{children}</LayoutContent>
                </MenuProvider>
            </BreadcrumbProvider>
        </SidebarProvider>
    )
}

export default MainLayout
