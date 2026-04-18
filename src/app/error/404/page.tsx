'use client'

import React from 'react'
import ErrorPage from '@/shared/components/ErrorPage'

export default function Error404Page() {
  return (
    <ErrorPage
      status="404"
      title="Không tìm thấy trang"
      subTitle="Trang bạn đang tìm không tồn tại hoặc đã bị chuyển đi."
    />
  )
}
