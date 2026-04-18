import { Suspense } from 'react'
import type { Metadata } from 'next'
import DashboardView from './_components/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard | Mono Studio Admin',
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <span style={{ color: '#999', fontSize: 14 }}>Đang tải dữ liệu...</span>
      </div>
    }>
      <DashboardView />
    </Suspense>
  )
}