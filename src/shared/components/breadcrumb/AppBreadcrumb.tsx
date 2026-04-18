'use client'

import React from 'react'
import { Breadcrumb } from 'antd'
import Link from 'next/link'
import { useBreadcrumbContext } from '../../contexts/BreadcrumbContext'
import { HomeOutlined } from '@ant-design/icons'

const AppBreadcrumb: React.FC = () => {
    const { items } = useBreadcrumbContext()

    const breadcrumbItems = [
        {
            title: (
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HomeOutlined /> Trang chủ
                </Link>
            ),
        },
        ...items.map((item, index) => {
            const isLast = index === items.length - 1;
            return {
                title: item.href ? (
                    <Link href={item.href}>{item.title}</Link>
                ) : (
                    <span style={{
                        color: isLast ? '#5856d6' : 'inherit',
                        fontWeight: isLast ? 600 : 400
                    }}>
                        {item.title}
                    </span>
                ),
            };
        }),
    ];

    if (items.length === 0) return null

    return (
        <Breadcrumb
            items={breadcrumbItems}
            style={{ margin: '0 0 16px 0' }}
        />
    )
}

export default AppBreadcrumb
