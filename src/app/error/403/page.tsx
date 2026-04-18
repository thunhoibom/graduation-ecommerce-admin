'use client'

import React from 'react'
import ErrorPage from '@/shared/components/ErrorPage'

export default function Error403Page() {
  return (
    <ErrorPage
      status="403"
      title="Không có quyền truy cập"
      subTitle="Bạn không có quyền xem trang này."
    />
  )
}
