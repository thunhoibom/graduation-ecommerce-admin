import { Suspense } from 'react'
import type { Metadata } from 'next'
import MainLayout from '@/layouts/MainLayout'
import CategoryListView from '../_components/CategoryListView'

export const metadata: Metadata = {
  title: 'Danh mục sản phẩm | Mono Studio Admin',
}

export default function CategoriesPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
        <CategoryListView />
      </Suspense>
    </MainLayout>
  )
}