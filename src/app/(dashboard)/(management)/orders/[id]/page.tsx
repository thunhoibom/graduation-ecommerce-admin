import { Suspense } from 'react'
import type { Metadata } from 'next'
import OrderDetailView from './_components/OrderDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Chi tiết đơn hàng | Mono Studio Admin',
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <OrderDetailView orderId={Number(id)} />
    </Suspense>
  )
}
