'use client'

import MainLayout from '@/layouts/MainLayout'

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
