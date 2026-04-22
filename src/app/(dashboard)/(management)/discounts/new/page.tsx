import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const DiscountFormPage = dynamic(() => import('../_components/DiscountFormPage'), {
})

export const metadata: Metadata = {
  title: 'Thêm mã giảm giá | Mono Studio Admin',
}

export default function NewDiscountPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <DiscountFormPage />
    </Suspense>
  )
}