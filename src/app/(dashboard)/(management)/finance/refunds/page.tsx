import { Suspense } from 'react'
import type { Metadata } from 'next'
import ReturnRefundOpsPanel from '../../returns/_components/ReturnRefundOpsPanel'

export const metadata: Metadata = {
  title: 'Hoàn tiền & Retry queue | Mono Studio Admin',
}

export default function FinanceRefundsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <ReturnRefundOpsPanel />
    </Suspense>
  )
}
