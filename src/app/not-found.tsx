'use client'

import React from 'react'
import ErrorPage from '@/shared/components/ErrorPage'

export default function NotFound() {
  return (
    <ErrorPage
      status="404"
      title="Không tìm thấy trang"
      subTitle="Trang bạn đang tìm không tồn tại hoặc đã bị chuyển đi."
    />
  )
}
