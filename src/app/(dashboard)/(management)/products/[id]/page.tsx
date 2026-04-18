import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductFormPage from '../../_components/form/ProductFormPage'

export const metadata: Metadata = {
  title: 'Sửa sản phẩm | Mono Studio Admin',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ProductFormPage productId={id} />
    </Suspense>
  )
}
