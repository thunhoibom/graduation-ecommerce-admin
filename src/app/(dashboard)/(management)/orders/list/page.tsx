import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const OrderListView = dynamic(() => import('../_components/OrderListView'), {
})

export const metadata: Metadata = {
  title: 'Danh sách đơn hàng | Mono Studio Admin',
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <OrderListView />
    </Suspense>
  )
}