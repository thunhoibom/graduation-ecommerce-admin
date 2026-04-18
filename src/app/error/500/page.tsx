'use client'

import React from 'react'
import ErrorPage from '@/shared/components/ErrorPage'

export default function Error500Page() {
  return (
    <ErrorPage
      status="500"
      title="Lỗi hệ thống"
      subTitle="Đã có lỗi xảy ra. Vui lòng thử lại sau."
    />
  )
}
