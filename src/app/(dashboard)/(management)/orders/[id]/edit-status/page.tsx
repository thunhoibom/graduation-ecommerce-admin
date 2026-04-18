import { Suspense } from 'react'
import type { Metadata } from 'next'
import OrderStatusView from './_components/OrderStatusView'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Cập nhật trạng thái đơn hàng | Mono Studio Admin',
}

export default async function OrderEditStatusPage({ params }: PageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <OrderStatusView orderId={Number(id)} />
    </Suspense>
  )
}