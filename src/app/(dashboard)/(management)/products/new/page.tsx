import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import ProductFormPage from '../_components/form/ProductFormPage'

export const metadata: Metadata = {
  title: 'Thêm sản phẩm mới | Mono Studio Admin',
}

export default function NewProductPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <ProductFormPage />
      </Suspense>
    </MainLayout>
  )
}