import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import DiscountListView from '../_components/DiscountListView'

export const metadata: Metadata = {
  title: 'Mã giảm giá | Mono Studio Admin',
}

export default function DiscountsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <DiscountListView />
      </Suspense>
    </MainLayout>
  )
}