import { Suspense } from 'react'
import type { Metadata } from 'next'
import CustomerDetailView from './_components/CustomerDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Khách hàng #${id} | Mono Studio Admin` }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <CustomerDetailView customerId={Number(id)} />
    </Suspense>
  )
}