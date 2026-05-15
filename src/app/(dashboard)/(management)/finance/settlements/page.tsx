import { redirect } from 'next/navigation'
import { paths } from '@/routes/paths'

export default function FinanceSettlementsPage() {
  redirect(paths.dashboard.root)
}
