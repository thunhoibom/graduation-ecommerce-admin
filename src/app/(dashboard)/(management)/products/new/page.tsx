import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductFormPage from '../_components/form/ProductFormPage'

export const metadata: Metadata = {
  title: 'Thêm sản phẩm mới | Mono Studio Admin',
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ProductFormPage />
    </Suspense>
  )
}