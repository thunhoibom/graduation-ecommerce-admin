import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cài đặt | Mono Studio Admin',
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ color: '#595959', marginBottom: 8 }}>Cài đặt hệ thống</h2>
        <p style={{ color: '#8c8c8c' }}>Trang đang trong quá trình phát triển</p>
      </div>
    </Suspense>
  )
}