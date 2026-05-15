import { redirect } from 'next/navigation'
import { paths } from '@/routes/paths'

export default function FinanceFailedPaymentsPage() {
  redirect(paths.dashboard.root)
}
