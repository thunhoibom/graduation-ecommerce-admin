'use client'

import React, { useMemo } from 'react'
import {
  Breadcrumb, Card, Empty, Tag, Tooltip, Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  listUserRolesWithPermissions,
  type UserRoleWithPermissionsPojo,
} from '@/services/rest-api/app-api/users/user-role-service'
import AppTable from '@/shared/components/antd/AppTable'

const { Title, Text } = Typography

export default function UserRoleListView() {
  const { data, isLoading } = useAxiosSWR<UserRoleWithPermissionsPojo[]>(
    [SWR_KEYS.USER_ROLE_LIST, 'with-permissions'],
    async () => listUserRolesWithPermissions(),
    { revalidateOnMount: true },
  )

  const columns: ColumnsType<UserRoleWithPermissionsPojo> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      width: 180,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Quyền truy cập',
      dataIndex: 'permissions',
      render: (permissions: UserRoleWithPermissionsPojo['permissions']) => {
        if (!permissions?.length) {
          return <Text type="secondary">Chưa gán quyền</Text>
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {permissions.map((permission) => (
              <Tooltip
                key={permission.code}
                title={permission.description || permission.code}
              >
                <Tag>{permission.code}</Tag>
              </Tooltip>
            ))}
          </div>
        )
      },
    },
  ], [])

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Người dùng' }, { title: 'Vai trò & quyền' }]} />
        <div style={{ marginTop: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Vai trò & quyền truy cập</Title>
          <Text type="secondary">
            Tham chiếu vai trò và quyền API mà tài khoản đăng nhập được phép dùng. Gán quyền cho vai trò mới qua cơ sở dữ liệu hoặc migration.
          </Text>
        </div>
      </div>

      <Card>
        <AppTable
          rowKey={(record) => String(record.id ?? record.name)}
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          pagination={false}
          locale={{
            emptyText: <Empty description="Chưa có vai trò nào" />,
          }}
        />
      </Card>
    </>
  )
}
