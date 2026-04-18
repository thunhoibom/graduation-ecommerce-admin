'use client'

import React from 'react'
import { Button, Space } from 'antd'
import ErrorPage from '@/shared/components/ErrorPage'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      status="500"
      title="Có lỗi xảy ra"
      subTitle={error.message || 'Vui lòng thử lại sau.'}
      extra={
        <Space>
          <Button onClick={() => window.history.back()}>Quay lại</Button>
          <Button type="primary" onClick={() => reset()}>
            Thử lại
          </Button>
        </Space>
      }
    />
  )
}
