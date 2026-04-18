import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'

export const metadata: Metadata = {
  title: 'Thêm mã giảm giá | Mono Studio Admin',
}

export default function NewDiscountPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ color: '#595959', marginBottom: 8 }}>Thêm mã giảm giá mới</h2>
          <p style={{ color: '#8c8c8c' }}>Trang đang trong quá trình phát triển</p>
        </div>
      </Suspense>
    </MainLayout>
  )
}