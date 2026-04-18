import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import ShippingListView from './_components/ShippingListView'

export const metadata: Metadata = {
  title: 'Phương thức vận chuyển | Mono Studio Admin',
}

export default function ShippingPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <ShippingListView />
      </Suspense>
    </MainLayout>
  )
}