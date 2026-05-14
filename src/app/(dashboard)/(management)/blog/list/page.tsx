import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const BlogListView = dynamic(() => import('../_components/BlogListView'))

export const metadata: Metadata = {
  title: 'Quản lý Blog | Mono Studio Admin',
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <BlogListView />
    </Suspense>
  )
}
