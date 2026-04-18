'use client'

import React from 'react'
import Link from 'next/link'
import { Button, Result, Space } from 'antd'

type ErrorPageProps = {
  status: '403' | '404' | '500'
  title: string
  subTitle?: string
  extra?: React.ReactNode
}

export default function ErrorPage({
  status,
  title,
  subTitle,
  extra,
}: ErrorPageProps) {
  const defaultActions = (
    <Space>
      <Button onClick={() => window.history.back()}>Quay lại</Button>
      <Link href="/">
        <Button type="primary">Về trang chủ</Button>
      </Link>
    </Space>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: 24,
      }}
    >
      <Result status={status} title={title} subTitle={subTitle} extra={extra ?? defaultActions} />
    </div>
  )
}
