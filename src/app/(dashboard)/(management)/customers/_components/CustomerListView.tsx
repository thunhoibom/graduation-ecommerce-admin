'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, Card, Typography, Row, Col, Button, Input, Space, message,
} from 'antd'
import {
  SearchOutlined, EyeOutlined, MailOutlined, PhoneOutlined,
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

const { Title, Text } = Typography

// ── CustomerListView ────────────────────────────────────────────

const CustomerListView: React.FC = () => {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [queryParams, setQueryParams] = useState<Partial<CustomerSearchParams>>({
    page: 1,
    size: 20,
  })

  const { data, isLoading } = useAxiosSWR<{
    data: CustomerPojo[]
    totalElements: number
  }>(
    [SWR_KEYS.CUSTOMER_LIST, queryParams],
    async () => {
      const res = await searchCustomers(queryParams as CustomerSearchParams)
      return {
        data: res.data ?? [],
        totalElements: res.totalElements ?? 0,
      }
    },
    { revalidateOnMount: true },
  )

  const handleTableChange = useCallback((page: number, size: number) => {
    setQueryParams((prev) => ({ ...prev, page, size }))
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQueryParams((prev) => ({
      ...prev,
      name: value || undefined,
      email: value || undefined,
      phone: value || undefined,
      page: 1,
    }))
  }, [])

  const columns: ColumnsType<CustomerPojo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => <Text code>#{id}</Text>,
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
        <Space direction="vertical" size={0}>
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
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CustomerPojo) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/customers/${record.id}`)}
          title="Xem chi tiết"
        />
      ),
    },
  ]

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý khách hàng</Title>
        <Text type="secondary">Danh sách khách hàng đã đăng ký</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={16} md={12}>
            <Input.Search
              placeholder="Tìm theo tên, email, SĐT..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 700 }}
        pagination={{
          current: queryParams.page ?? 1,
          pageSize: queryParams.size ?? 20,
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
