'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Typography, Button, Input, Space, Tag, Tooltip,
} from 'antd'
import {
  SearchOutlined, EyeOutlined, MailOutlined, PhoneOutlined, PlusOutlined, UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import {
  searchCustomers,
  type CustomerPojo,
  type CustomerSearchParams,
} from '@/services/rest-api/app-api/customers/customer-service'
import AppTable from '@/shared/components/antd/AppTable'
import {
  ListFilterCard,
  ListFilterCol,
  ListFilterField,
  ListFilterGrid,
  LIST_FILTER_SEARCH_FLEX,
} from '@/shared/components/list-filter'
import CustomerCreateModal from './CustomerCreateModal'

const { Title, Text } = Typography

const rowCustomerId = (record: CustomerPojo): number =>
  record.customerId ?? record.id ?? 0

const formatVND = (value: number | null | undefined) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── CustomerListView ────────────────────────────────────────────

const CustomerListView: React.FC = () => {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [queryParams, setQueryParams] = useState<Partial<CustomerSearchParams>>({
    pageIndex: 0,
    pageSize: 20,
  })

  const { data, isLoading, mutate } = useAxiosSWR<{
    data: CustomerPojo[]
    totalElements: number
  }>(
    [SWR_KEYS.CUSTOMER_LIST, queryParams],
    async () => {
      const res = await searchCustomers(queryParams as CustomerSearchParams)
      return {
        data: res.items ?? [],
        totalElements: res.totalCount ?? 0,
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

  const handleSearch = useCallback((value: string) => {
    setQueryParams((prev) => ({
      ...prev,
      q: value.trim() || undefined,
      pageIndex: 0,
    }))
  }, [])

  const columns: ColumnsType<CustomerPojo> = [
    {
      title: 'ID',
      key: 'id',
      width: 70,
      render: (_: unknown, record: CustomerPojo) => (
        <Text code>#{rowCustomerId(record)}</Text>
      ),
    },
    {
      title: 'Họ tên',
      key: 'fullName',
      ellipsis: true,
      render: (_: unknown, record: CustomerPojo) => (
        <div>
          <Text strong>
            {[record.firstName, record.lastName].filter(Boolean).join(' ') || '—'}
          </Text>
          <br />
          {record.email && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      width: 150,
      render: (_: unknown, record: CustomerPojo) => (
        <Space orientation="vertical" size={0}>
          {record.phone1 && (
            <Text>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone1}
            </Text>
          )}
          {record.phone2 && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone2}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'CMND/CCCD',
      dataIndex: 'idNumber',
      key: 'idNumber',
      width: 130,
      render: (v: string) => v ? <Text copyable={{ text: v }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Đơn hàng',
      key: 'orderCount',
      width: 88,
      align: 'right',
      render: (_: unknown, record: CustomerPojo) => (
        <Text>{record.orderCount != null ? record.orderCount : '—'}</Text>
      ),
    },
    {
      title: 'Hạng / Điểm',
      key: 'loyalty',
      width: 130,
      render: (_: unknown, record: CustomerPojo) => (
        <Space orientation="vertical" size={0}>
          {record.loyaltyTier ? (
            <Tag color="blue">{record.loyaltyTier}</Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          )}
          {record.loyaltyPointsBalance != null ? (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.loyaltyPointsBalance} điểm</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Chi tiêu tháng',
      key: 'monthlySpend',
      width: 130,
      align: 'right',
      render: (_: unknown, record: CustomerPojo) => (
        <Tooltip title="Giá trị theo trường monthlySpendCents trên server (đồng)">
          <Text>{formatVND(record.monthlySpendCents ?? undefined)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Tài khoản',
      key: 'linkedAccount',
      width: 100,
      render: (_: unknown, record: CustomerPojo) =>
        record.linkedAccount ? (
          <Tag icon={<UserOutlined />} color="success">Đã liên kết</Tag>
        ) : (
          <Tag>Khách</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CustomerPojo) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/customers/${rowCustomerId(record)}`)}
          title="Xem chi tiết"
        />
      ),
    },
  ]

  return (
    <>
      <CustomerCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => mutate()}
      />

      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý khách hàng</Title>
          <Text type="secondary">Danh sách khách hàng đã đăng ký</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Thêm khách hàng
        </Button>
      </div>

      {/* Filters */}
      <ListFilterCard>
        <ListFilterGrid>
          <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
            <ListFilterField label="Từ khóa">
              <Input.Search
                placeholder="Tìm theo tên, email, SĐT..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
              />
            </ListFilterField>
          </ListFilterCol>
        </ListFilterGrid>
      </ListFilterCard>

      {/* Table */}
      <AppTable
        rowKey={(r) => String(rowCustomerId(r))}
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 1180 }}
        pagination={{
          current: (queryParams.pageIndex ?? 0) + 1,
          pageSize: queryParams.pageSize ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} của ${t} khách hàng`,
          onChange: handleTableChange,
        }}
      />
    </>
  )
}

export default CustomerListView
