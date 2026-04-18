import { Suspense } from 'react'
import type { Metadata } from 'next'
import OrderListView from '../_components/OrderListView'

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