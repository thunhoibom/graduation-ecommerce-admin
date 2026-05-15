'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  Breadcrumb, Button, Input, Popconfirm, Select, Space, Tag, Typography, message,
} from 'antd'
import {
  EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  deleteUser,
  searchUsers,
  type UserPojo,
  type UserSearchParams,
} from '@/services/rest-api/app-api/users/user-service'
import { searchUserRoles } from '@/services/rest-api/app-api/users/user-role-service'
import AppTable from '@/shared/components/antd/AppTable'
import {
  ListFilterCard,
  ListFilterCol,
  ListFilterField,
  ListFilterGrid,
  LIST_FILTER_SEARCH_FLEX,
  LIST_FILTER_SELECT_FLEX,
} from '@/shared/components/list-filter'
import UserFormModal from './UserFormModal'

const { Title, Text } = Typography

const getPersonName = (user: UserPojo) =>
  [user.person?.firstName, user.person?.lastName].filter(Boolean).join(' ') || '—'

const UserListView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<UserSearchParams>>({
    pageIndex: 0,
    pageSize: 20,
    sortBy: 'name',
    order: 'asc',
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserPojo | null>(null)

  const { data: rolesData } = useAxiosSWR(
    [SWR_KEYS.USER_ROLE_LIST, 'options'],
    async () => searchUserRoles({ pageIndex: 0, pageSize: 200 }),
    { revalidateOnMount: true },
  )

  const roleOptions = useMemo(
    () => (rolesData?.items ?? []).map((role) => ({ label: role.name, value: role.name })),
    [rolesData?.items],
  )

  const { data, isLoading, mutate } = useAxiosSWR<{
    items: UserPojo[]
    totalCount: number
  }>(
    [SWR_KEYS.USER_LIST, queryParams],
    async () => {
      const response = await searchUsers(queryParams as UserSearchParams)
      return {
        items: response.items ?? [],
        totalCount: response.totalCount ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({
      ...prev,
      pageIndex: Math.max(0, page - 1),
      pageSize: size,
    }))
  }, [])

  const handleDelete = async (user: UserPojo) => {
    if (!user.id) return
    try {
      await deleteUser(user.id)
      messageApi.success('Đã xóa tài khoản')
      mutate()
    } catch {
      messageApi.error('Không thể xóa tài khoản (có thể là tài khoản được bảo vệ).')
    }
  }

  const columns: ColumnsType<UserPojo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (id: number) => <Text code>#{id}</Text>,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 160,
      render: (role?: string) => <Tag color="blue">{role ?? '—'}</Tag>,
    },
    {
      title: 'Hồ sơ liên kết',
      key: 'person',
      ellipsis: true,
      render: (_: unknown, record: UserPojo) => (
        <div>
          <Text>{getPersonName(record)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.person?.email ?? '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      width: 140,
      render: (_: unknown, record: UserPojo) => record.person?.phone1 ?? '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: UserPojo) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record)
              setFormOpen(true)
            }}
          />
          <Popconfirm
            title="Xóa tài khoản này?"
            okText="Xóa"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Quản lý' }, { title: 'Người dùng' }, { title: 'Tài khoản' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Quản lý tài khoản</Title>
            <Text type="secondary">Tạo, phân quyền và đặt lại mật khẩu tài khoản đăng nhập admin/store.</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null)
              setFormOpen(true)
            }}
          >
            Thêm tài khoản
          </Button>
        </div>
      </div>

      <ListFilterCard>
        <ListFilterGrid>
          <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
            <ListFilterField label="Tên đăng nhập">
              <Input.Search
                placeholder="Tìm tên đăng nhập..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(value) => {
                  setQueryParams((prev) => ({
                    ...prev,
                    nameLike: value.trim() || undefined,
                    pageIndex: 0,
                  }))
                }}
              />
            </ListFilterField>
          </ListFilterCol>
          <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
            <ListFilterField label="Email hồ sơ">
              <Input.Search
                placeholder="Tìm email hồ sơ..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(value) => {
                  setQueryParams((prev) => ({
                    ...prev,
                    emailLike: value.trim() || undefined,
                    pageIndex: 0,
                  }))
                }}
              />
            </ListFilterField>
          </ListFilterCol>
          <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
            <ListFilterField label="Vai trò">
              <Select
                allowClear
                placeholder="Lọc vai trò"
                style={{ width: '100%' }}
                options={roleOptions}
                onChange={(value) => {
                  setQueryParams((prev) => ({
                    ...prev,
                    role: value,
                    pageIndex: 0,
                  }))
                }}
              />
            </ListFilterField>
          </ListFilterCol>
        </ListFilterGrid>
      </ListFilterCard>

      <AppTable
        rowKey={(record) => String(record.id ?? record.name)}
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 1000 }}
        pagination={{
          current: (queryParams.pageIndex ?? 0) + 1,
          pageSize: queryParams.pageSize ?? 20,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}–${range[1]} của ${total} tài khoản`,
          onChange: handleTableChange,
        }}
      />

      <UserFormModal
        open={formOpen}
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser}
        roleOptions={roleOptions}
        onClose={() => {
          setFormOpen(false)
          setEditingUser(null)
        }}
        onSaved={mutate}
      />
    </>
  )
}

export default UserListView
