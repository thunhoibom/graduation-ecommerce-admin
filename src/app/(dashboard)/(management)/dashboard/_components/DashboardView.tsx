'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  DatePicker,
  Spin,
  Alert,
  Progress,
  Tooltip,
  Empty,
  Badge,
} from 'antd'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import {
  RevenueStatPojo,
  TopProductPojo,
  LowStockAlertPojo,
  OrderStatusCountPojo,
  AdminDashboardStatsPojo,
} from '../types'
import { dashboardService } from '../_services/dashboard-service'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeOrderStatus,
} from '@/constants/order-status'
import { addNewOrderListener } from '@/shared/notifications/admin-notification-events'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
type DashboardRangeValue = Parameters<NonNullable<RangePickerProps['onChange']>>[0]

// Format VND currency
const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number | undefined) => {
  if (value === undefined || value === null) return 0
  return new Intl.NumberFormat('vi-VN').format(value)
}

const STATUS_CONFIG = {
  ...FULFILLMENT_STATUS_CONFIG,
  ...PAYMENT_STATUS_CONFIG,
}

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStatsPojo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DashboardRangeValue>(null)

  const fetchStats = useCallback(async (from?: string, to?: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await dashboardService.getStats({ from, to })
      setStats(data)
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Default: last 30 days
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const unsubscribe = addNewOrderListener(() => {
      if (dateRange && dateRange[0] && dateRange[1]) {
        fetchStats(
          dateRange[0].format('YYYY-MM-DD'),
          dateRange[1].format('YYYY-MM-DD'),
        )
        return
      }
      fetchStats()
    })

    return unsubscribe
  }, [dateRange, fetchStats])

  const handleDateChange: RangePickerProps['onChange'] = (dates) => {
    setDateRange(dates)
    if (dates && dates[0] && dates[1]) {
      fetchStats(
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD')
      )
    } else {
      fetchStats()
    }
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu Dashboard"
        description={error}
        type="error"
        showIcon
        action={
          <a onClick={() => fetchStats()} style={{ fontSize: 13 }}>
            Thử lại
          </a>
        }
      />
    )
  }

  const totalOrders = stats?.orderStatusBreakdown?.reduce((sum, s) => sum + (s.count || 0), 0) ?? 0

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Tổng quan hoạt động kinh doanh</Text>
        </div>
        <RangePicker
          value={dateRange}
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          allowClear
          placeholder={['Từ ngày', 'Đến ngày']}
          style={{ borderRadius: 8 }}
        />
      </div>

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Tổng doanh thu</Text>}
                  value={stats?.totalRevenue ?? 0}
                  formatter={(v) => <span style={{ color: '#52c41a' }}>{formatVND(Number(v))}</span>}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  styles={{ content: { color: '#52c41a', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Tổng đơn hàng</Text>}
                  value={stats?.totalOrders ?? 0}
                  formatter={(v) => <span style={{ color: '#5856d6' }}>{formatNumber(Number(v))}</span>}
                  prefix={<ShoppingCartOutlined style={{ color: '#5856d6' }} />}
                  styles={{ content: { color: '#5856d6', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Sản phẩm bán chạy</Text>}
                  value={stats?.topProducts?.length ?? 0}
                  formatter={(v) => <span style={{ color: '#fa8c16' }}>{String(v)}</span>}
                  prefix={<TrophyOutlined style={{ color: '#fa8c16' }} />}
                  suffix="sản phẩm"
                  styles={{ content: { color: '#fa8c16', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Cảnh báo tồn kho</Text>}
                  value={stats?.lowStockAlerts?.length ?? 0}
                  formatter={(v) => (
                    <span style={{ color: Number(v) > 0 ? '#ff4d4f' : '#52c41a' }}>
                      {String(v)}
                    </span>
                  )}
                  prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                  styles={{
                    content: {
                      color: (stats?.lowStockAlerts?.length ?? 0) > 0 ? '#ff4d4f' : '#52c41a',
                      fontWeight: 700,
                    }
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Inventory process KPI cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">PO đang mở</Text>}
                  value={stats?.inventoryKpis?.openPurchaseOrders ?? 0}
                  formatter={(v) => <span style={{ color: '#5856d6' }}>{formatNumber(Number(v))}</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Kiểm kê chờ approve</Text>}
                  value={stats?.inventoryKpis?.pendingStockCountApprovals ?? 0}
                  formatter={(v) => <span style={{ color: '#cf1322' }}>{formatNumber(Number(v))}</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title={<Text type="secondary">Variance chờ post</Text>}
                  value={stats?.inventoryKpis?.approvedStockCountsToPost ?? 0}
                  formatter={(v) => <span style={{ color: '#722ed1' }}>{formatNumber(Number(v))}</span>}
                />
              </Card>
            </Col>
          </Row>

          {/* Order Status Breakdown */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <ThunderboltOutlined style={{ color: '#5856d6' }} />
                    <span>Tình trạng đơn hàng</span>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {(!stats?.orderStatusBreakdown || stats.orderStatusBreakdown.length === 0) ? (
                  <Empty description="Không có dữ liệu" />
                ) : (
                  <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                    {stats.orderStatusBreakdown.map((item: OrderStatusCountPojo) => {
                      const statusKey = normalizeOrderStatus(item.status)
                      const statusConfig = STATUS_CONFIG[statusKey]
                      const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
                      return (
                        <div key={item.status}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Tag color={statusConfig?.color ?? 'default'}>
                              {statusConfig?.label ?? item.status}
                            </Tag>
                            <Text strong>{formatNumber(item.count)} đơn</Text>
                          </div>
                          <Progress
                            percent={pct}
                            showInfo={false}
                            strokeColor="#5856d6"
                            railColor="#f0f0f0"
                            size="small"
                          />
                        </div>
                      )
                    })}
                  </Space>
                )}
              </Card>
            </Col>

            {/* Revenue Chart (Simple bar chart using cards) */}
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
                    <span>Doanh thu theo ngày</span>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {(!stats?.revenueByPeriod || stats.revenueByPeriod.length === 0) ? (
                  <Empty description="Không có dữ liệu doanh thu" />
                ) : (
                  (() => {
                    const recentRevenue = (stats.revenueByPeriod as RevenueStatPojo[]).slice(-7)
                    const maxRevenue = Math.max(...recentRevenue.map((r) => r.revenue), 1)

                    return (
                      <Row gutter={8} align="bottom" wrap={false}>
                        {recentRevenue.map((item: RevenueStatPojo) => {
                          const barHeight = Math.max(
                            Math.round((item.revenue / maxRevenue) * 120),
                            4,
                          )
                          return (
                            <Col key={item.date} flex="1 0 0" style={{ height: 160, minWidth: 70 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  height: '100%',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <Tooltip title={formatVND(item.revenue)}>
                                  <div
                                    style={{
                                      width: 40,
                                      height: barHeight,
                                      background:
                                        barHeight > 80
                                          ? 'linear-gradient(180deg, #52c41a, #73d13d)'
                                          : 'linear-gradient(180deg, #5856d6, #a78bfa)',
                                      borderRadius: '6px 6px 0 0',
                                      minHeight: 4,
                                      transition: 'height 0.3s ease',
                                      cursor: 'pointer',
                                    }}
                                  />
                                </Tooltip>
                                <Text type="secondary" style={{ fontSize: 11, marginTop: 6 }}>
                                  {dayjs(item.date).format('DD/MM')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                  {item.orderCount} đơn
                                </Text>
                              </div>
                            </Col>
                          )
                        })}
                      </Row>
                    )
                  })()
                )}
              </Card>
            </Col>
          </Row>

          {/* Bottom Row */}
          <Row gutter={[16, 16]}>
            {/* Top Products */}
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#fa8c16' }} />
                    <span>Top sản phẩm bán chạy</span>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {(!stats?.topProducts || stats.topProducts.length === 0) ? (
                  <Empty description="Chưa có dữ liệu sản phẩm" />
                ) : (
                  <Table
                    dataSource={stats.topProducts as TopProductPojo[]}
                    rowKey="productId"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: '#',
                        width: 48,
                        align: 'center',
                        render: (_: unknown, __: unknown, idx: number) => idx + 1,
                      },
                      {
                        title: 'Tên sản phẩm',
                        dataIndex: 'productName',
                        key: 'productName',
                        render: (name: string) => <Text strong>{name}</Text>,
                      },
                      {
                        title: 'Đã bán',
                        dataIndex: 'unitsSold',
                        key: 'unitsSold',
                        align: 'right',
                        render: (v: number) => (
                          <Text style={{ color: '#5856d6', fontWeight: 600 }}>
                            {formatNumber(v)} cái
                          </Text>
                        ),
                      },
                      {
                        title: 'Doanh thu',
                        dataIndex: 'revenue',
                        key: 'revenue',
                        align: 'right',
                        render: (v: number) => (
                          <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                            {formatVND(v)}
                          </Text>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            </Col>

            {/* Low Stock Alerts */}
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>Cảnh báo tồn kho thấp</span>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {(!stats?.lowStockAlerts || stats.lowStockAlerts.length === 0) ? (
                  <Empty description="Tất cả sản phẩm đều đủ hàng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    {(stats.lowStockAlerts as LowStockAlertPojo[]).slice(0, 8).map((item) => (
                      <Card
                        key={item.variantId}
                        size="small"
                        style={{ borderRadius: 8, border: '1px solid #fff7e6', background: '#fffbe6' }}
                        styles={{ body: { padding: '8px 12px' } }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>{item.productName}</Text>
                            {(item.size || item.color) && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {' '}
                                · {item.size} {item.color}
                              </Text>
                            )}
                          </div>
                          <Badge
                            count={item.currentStock}
                            style={{
                              backgroundColor: item.currentStock === 0 ? '#ff4d4f' : '#fa8c16',
                              fontSize: 11,
                            }}
                            showZero
                            overflowCount={999}
                          />
                        </div>
                      </Card>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}

export default DashboardView
