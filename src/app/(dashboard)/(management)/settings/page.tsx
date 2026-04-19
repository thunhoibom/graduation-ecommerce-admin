import { Suspense } from 'react'
import type { Metadata } from 'next'
import SettingsView from './_components/SettingsView'

export const metadata: Metadata = {
  title: 'Cài đặt | Mono Studio Admin',
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
      <SettingsView />
    </Suspense>
  )
}