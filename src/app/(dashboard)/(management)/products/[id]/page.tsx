import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductDetailPage from './_components/ProductDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Chi tiết sản phẩm | Mono Studio Admin',
}

export default async function ProductDetailRoutePage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ProductDetailPage productId={id} />
    </Suspense>
  )
}
