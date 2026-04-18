import { Suspense } from 'react'
import type { Metadata } from 'next'
import OrderNewView from './_components/OrderNewView'

export const metadata: Metadata = {
  title: 'Tạo đơn hàng thủ công | Mono Studio Admin',
}

export default function OrderNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <OrderNewView />
    </Suspense>
  )
}
