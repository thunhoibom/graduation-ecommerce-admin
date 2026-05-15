import type { Metadata } from 'next'
import UserRoleListView from './_components/UserRoleListView'

export const metadata: Metadata = {
  title: 'Vai trò & quyền | Mono Studio Admin',
}

export default function UserRolesPage() {
  return <UserRoleListView />
}
