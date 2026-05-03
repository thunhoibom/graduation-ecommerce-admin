import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Cài đặt | Mono Studio Admin',
}

export default function SettingsPage() {
  redirect('/dashboard')
}