import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductListView from '../_components/list/ProductListView'

export const metadata: Metadata = {
  title: 'Danh sách sản phẩm | Mono Studio Admin',
}

export default function ProductsListPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ProductListView />
    </Suspense>
  )
}