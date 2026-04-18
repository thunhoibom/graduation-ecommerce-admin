import { Suspense } from 'react'
import type { Metadata } from 'next'
import ShippingListView from './_components/ShippingListView'

export const metadata: Metadata = {
  title: 'Phương thức vận chuyển | Mono Studio Admin',
}

export default function ShippingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ShippingListView />
    </Suspense>
  )
}