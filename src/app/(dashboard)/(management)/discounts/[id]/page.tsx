import { Suspense } from 'react'
import type { Metadata } from 'next'
import DiscountFormPage from '../_components/DiscountFormPage'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Sửa mã giảm giá | Mono Studio Admin',
}

export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <DiscountFormPage discountId={id} />
    </Suspense>
  )
}
