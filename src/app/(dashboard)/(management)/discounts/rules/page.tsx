import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const PromotionRulesView = dynamic(() => import('./_components/PromotionRulesView'), {
})

export const metadata: Metadata = {
  title: 'Quy tắc khuyến mãi | Mono Studio Admin',
}

export default function PromotionRulesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <PromotionRulesView />
    </Suspense>
  )
}

