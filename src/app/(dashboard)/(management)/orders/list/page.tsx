import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import OrderListView from '../_components/OrderListView'

export const metadata: Metadata = {
  title: 'Danh sách đơn hàng | Mono Studio Admin',
}

export default function OrdersPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <OrderListView />
      </Suspense>
    </MainLayout>
  )
}