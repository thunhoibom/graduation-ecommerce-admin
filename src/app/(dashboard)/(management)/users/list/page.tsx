import type { Metadata } from 'next'
import UserListView from '../_components/UserListView'

export const metadata: Metadata = {
  title: 'Quản lý tài khoản | Mono Studio Admin',
}

export default function UserListPage() {
  return <UserListView />
}
