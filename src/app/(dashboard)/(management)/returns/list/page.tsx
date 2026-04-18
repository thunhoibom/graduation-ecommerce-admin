import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import ReturnListView from '../_components/ReturnListView'

export const metadata: Metadata = {
  title: 'Yêu cầu trả hàng | Mono Studio Admin',
}

export default function ReturnsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <ReturnListView />
      </Suspense>
    </MainLayout>
  )
}