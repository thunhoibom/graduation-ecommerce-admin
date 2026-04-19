import { Suspense } from 'react'
import type { Metadata } from 'next'
import MediaListView from '../_components/MediaListView'

export const metadata: Metadata = {
  title: 'Thư viện media | Mono Studio Admin',
}

export default function MediaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <MediaListView />
    </Suspense>
  )
}