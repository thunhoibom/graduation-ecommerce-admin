import { Suspense } from 'react'
import type { Metadata } from 'next'
import ReturnDetailView from './_components/ReturnDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Yêu cầu trả hàng #${id} | Mono Studio Admin` }
}

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ReturnDetailView returnId={Number(id)} />
    </Suspense>
  )
}