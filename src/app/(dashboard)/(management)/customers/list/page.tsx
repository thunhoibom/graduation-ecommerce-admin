import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import CustomerListView from '../_components/CustomerListView'

export const metadata: Metadata = {
  title: 'Khách hàng | Mono Studio Admin',
}

export default function CustomersPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <CustomerListView />
      </Suspense>
    </MainLayout>
  )
}