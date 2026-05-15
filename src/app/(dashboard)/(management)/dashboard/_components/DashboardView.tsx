'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  AuditOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import {
  AdminDashboardStatsPojo,
  LowStockAlertPojo,
  RestockSuggestionPojo,
  TopProductPojo,
} from '../types'
import { dashboardService } from '../_services/dashboard-service'
import { addNewOrderListener } from '@/shared/notifications/admin-notification-events'
import { searchOrders, type OrderPojo } from '@/services/rest-api/app-api/orders/order-service'
import { searchReturns } from '@/services/rest-api/app-api/returns/return-service'
import {
  getFinancePayments,
  type FinancePaymentItem,
} from '@/services/rest-api/app-api/finance/finance-service'
import { paths } from '@/routes/paths'
import DashboardRecentOrders from './DashboardRecentOrders'
import DashboardRevenueChart from './DashboardRevenueChart'
import DashboardOrderStatusChart from './DashboardOrderStatusChart'
import DashboardPaymentTransactions from './DashboardPaymentTransactions'
import { DASHBOARD_CARD_STYLE, formatNumber, formatVND } from './dashboard-utils'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
type DashboardRangeValue = Parameters<NonNullable<RangePickerProps['onChange']>>[0]

const DATE_PRESETS = [
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 },
] as const

const buildDefaultRange = (): [Dayjs, Dayjs] => [
  dayjs().subtract(29, 'day').startOf('day'),
  dayjs().endOf('day'),
]

const toQueryDates = (range: DashboardRangeValue) => {
  if (!range?.[0] || !range?.[1]) {
    return { from: undefined, to: undefined }
  }
  return {
    from: range[0].format('YYYY-MM-DD'),
    to: range[1].format('YYYY-MM-DD'),
  }
}

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStatsPojo | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderPojo[]>([])
  const [paymentTransactions, setPaymentTransactions] = useState<FinancePaymentItem[]>([])
  const [pendingReturns, setPendingReturns] = useState(0)
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestionPojo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DashboardRangeValue>(buildDefaultRange())
  const [activePreset, setActivePreset] = useState<number>(30)

  const fetchDashboard = useCallback(async (range: DashboardRangeValue) => {
    const { from, to } = toQueryDates(range)
    setLoading(true)
    setError(null)

    try {
      const [statsData, ordersRes, pendingReturnsRes, restockRes, paymentsRes] = await Promise.all([
        dashboardService.getStats({ from, to }),
        searchOrders({
          pageIndex: 0,
          pageSize: 6,
          dateFrom: from,
          dateTo: to,
          sortBy: 'date',
          order: 'desc',
        } as Parameters<typeof searchOrders>[0]),
        searchReturns({ status: 'PENDING', pageIndex: 0, pageSize: 1 }),
        dashboardService.getRestockSuggestions({ lookbackDays: 30, leadTimeDays: 14 }),
        getFinancePayments({ page: 1, size: 8, from, to }),
      ])

      setStats(statsData)
      setRecentOrders(ordersRes.items ?? [])
      setPaymentTransactions(paymentsRes.items ?? [])
      setPendingReturns(pendingReturnsRes.totalCount ?? 0)
      setRestockSuggestions(restockRes ?? [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard(dateRange)
  }, [dateRange, fetchDashboard])

  useEffect(() => {
    const unsubscribe = addNewOrderListener(() => {
      fetchDashboard(dateRange)
    })
    return unsubscribe
  }, [dateRange, fetchDashboard])

  const handleDateChange: RangePickerProps['onChange'] = (dates) => {
    setActivePreset(0)
    if (!dates?.[0] || !dates?.[1]) {
      setDateRange(buildDefaultRange())
      setActivePreset(30)
      return
    }
    setDateRange(dates)
  }

  const handlePresetChange = (days: number) => {
    setActivePreset(days)
    setDateRange([dayjs().subtract(days - 1, 'day').startOf('day'), dayjs().endOf('day')])
  }

  const handleRefresh = () => {
    fetchDashboard(dateRange)
  }

  const queryDates = useMemo(() => toQueryDates(dateRange), [dateRange])
  const totalOrders = stats?.orderStatusBreakdown?.reduce((sum, item) => sum + (item.count || 0), 0) ?? 0
  const recognizedOrderCount =
    stats?.revenueByPeriod?.reduce((sum, item) => sum + (item.orderCount || 0), 0) ?? 0
  const averageOrderValue =
    stats && recognizedOrderCount > 0
      ? Math.round(stats.totalRevenue / recognizedOrderCount)
      : 0
  const unitsSold = stats?.topProducts?.reduce((sum, item) => sum + (item.unitsSold || 0), 0) ?? 0
  const inventoryKpis = stats?.inventoryKpis
  const attentionCount =
    (stats?.lowStockAlerts?.length ?? 0) +
    (inventoryKpis?.openPurchaseOrders ?? 0) +
    (inventoryKpis?.pendingTransferApprovals ?? 0) +
    (inventoryKpis?.pendingStockCountApprovals ?? 0) +
    pendingReturns

  if (error) {
    return (
      <Alert
        title="Lỗi tải dữ liệu Dashboard"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="link" onClick={handleRefresh}>
            Thử lại
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">Tổng quan hoạt động kinh doanh, vận hành và tồn kho</Text>
        </div>
        <Space wrap align="start">
          <Segmented
            value={activePreset > 0 ? activePreset : undefined}
            onChange={(value) => handlePresetChange(Number(value))}
            options={DATE_PRESETS.map((preset) => ({
              label: preset.label,
              value: preset.value,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            allowClear
            placeholder={['Từ ngày', 'Đến ngày']}
            style={{ borderRadius: 8 }}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            Làm mới
          </Button>
        </Space>
      </div>

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <>
          {attentionCount > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 24, borderRadius: 12 }}
              title="Có hạng mục cần xử lý"
              description={
                <Space wrap>
                  {pendingReturns > 0 && (
                    <Link href={paths.returns.list}>Yêu cầu trả hàng chờ duyệt: {pendingReturns}</Link>
                  )}
                  {(stats?.lowStockAlerts?.length ?? 0) > 0 && (
                    <Link href={paths.products.list}>
                      Biến thể tồn kho thấp: {stats?.lowStockAlerts?.length}
                    </Link>
                  )}
                  {(inventoryKpis?.openPurchaseOrders ?? 0) > 0 && (
                    <Link href={paths.inventory.purchaseOrders}>
                      PO đang mở: {inventoryKpis?.openPurchaseOrders}
                    </Link>
                  )}
                </Space>
              }
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} xl={6}>
              <Card variant="borderless" style={DASHBOARD_CARD_STYLE}>
                <Statistic
                  title={<Text type="secondary">Doanh thu thuần</Text>}
                  value={stats?.totalRevenue ?? 0}
                  formatter={(value) => <span style={{ color: '#52c41a' }}>{formatVND(Number(value))}</span>}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  styles={{ content: { color: '#52c41a', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card variant="borderless" style={DASHBOARD_CARD_STYLE}>
                <Statistic
                  title={<Text type="secondary">Tổng đơn hàng</Text>}
                  value={stats?.totalOrders ?? 0}
                  formatter={(value) => <span style={{ color: '#5856d6' }}>{formatNumber(Number(value))}</span>}
                  prefix={<ShoppingCartOutlined style={{ color: '#5856d6' }} />}
                  styles={{ content: { color: '#5856d6', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card variant="borderless" style={DASHBOARD_CARD_STYLE}>
                <Statistic
                  title={<Text type="secondary">Giá trị đơn trung bình (thuần)</Text>}
                  value={averageOrderValue}
                  formatter={(value) => <span style={{ color: '#1677ff' }}>{formatVND(Number(value))}</span>}
                  prefix={<RiseOutlined style={{ color: '#1677ff' }} />}
                  styles={{ content: { color: '#1677ff', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card variant="borderless" style={DASHBOARD_CARD_STYLE}>
                <Statistic
                  title={<Text type="secondary">Sản phẩm đã bán</Text>}
                  value={unitsSold}
                  formatter={(value) => <span style={{ color: '#fa8c16' }}>{formatNumber(Number(value))}</span>}
                  prefix={<TrophyOutlined style={{ color: '#fa8c16' }} />}
                  suffix="cái"
                  styles={{ content: { color: '#fa8c16', fontWeight: 700 } }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.inventory.purchaseOrders}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">PO đang mở</Text>}
                    value={inventoryKpis?.openPurchaseOrders ?? 0}
                    formatter={(value) => <span style={{ color: '#5856d6' }}>{formatNumber(Number(value))}</span>}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.inventory.transfers}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">Chuyển kho chờ duyệt</Text>}
                    value={inventoryKpis?.pendingTransferApprovals ?? 0}
                    formatter={(value) => <span style={{ color: '#13c2c2' }}>{formatNumber(Number(value))}</span>}
                    prefix={<SwapOutlined style={{ color: '#13c2c2' }} />}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.inventory.stockCounts}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">Kiểm kê chờ approve</Text>}
                    value={inventoryKpis?.pendingStockCountApprovals ?? 0}
                    formatter={(value) => <span style={{ color: '#cf1322' }}>{formatNumber(Number(value))}</span>}
                    prefix={<AuditOutlined style={{ color: '#cf1322' }} />}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.inventory.stockCounts}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">Variance chờ post</Text>}
                    value={inventoryKpis?.approvedStockCountsToPost ?? 0}
                    formatter={(value) => <span style={{ color: '#722ed1' }}>{formatNumber(Number(value))}</span>}
                    prefix={<InboxOutlined style={{ color: '#722ed1' }} />}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.returns.list}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">Trả hàng chờ duyệt</Text>}
                    value={pendingReturns}
                    formatter={(value) => <span style={{ color: '#fa8c16' }}>{formatNumber(Number(value))}</span>}
                    prefix={<UndoOutlined style={{ color: '#fa8c16' }} />}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={8} xl={4}>
              <Link href={paths.products.list}>
                <Card hoverable variant="borderless" style={DASHBOARD_CARD_STYLE}>
                  <Statistic
                    title={<Text type="secondary">Cảnh báo tồn kho</Text>}
                    value={stats?.lowStockAlerts?.length ?? 0}
                    formatter={(value) => (
                      <span style={{ color: Number(value) > 0 ? '#ff4d4f' : '#52c41a' }}>{String(value)}</span>
                    )}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                  />
                </Card>
              </Link>
            </Col>
          </Row>

          <Card
            title="Thao tác nhanh"
            variant="borderless"
            style={{ ...DASHBOARD_CARD_STYLE, marginBottom: 24 }}
          >
            <Space wrap>
              <Link href={paths.orders.list}>
                <Button icon={<ShoppingCartOutlined />}>Đơn hàng</Button>
              </Link>
              <Link href={paths.returns.list}>
                <Button icon={<UndoOutlined />}>Trả hàng / Hoàn tiền</Button>
              </Link>
              <Link href={paths.products.list}>
                <Button icon={<TrophyOutlined />}>Sản phẩm</Button>
              </Link>
              <Link href={paths.inventory.purchaseOrders}>
                <Button icon={<InboxOutlined />}>Đặt hàng nhập</Button>
              </Link>
              <Link href={paths.inventory.stockCounts}>
                <Button icon={<AuditOutlined />}>Kiểm kê kho</Button>
              </Link>
            </Space>
          </Card>

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
                style={DASHBOARD_CARD_STYLE}
              >
                <DashboardOrderStatusChart
                  items={stats?.orderStatusBreakdown ?? []}
                  totalOrders={totalOrders}
                />
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <DashboardRevenueChart
                fallbackSeries={stats?.revenueByPeriod ?? []}
                from={queryDates.from}
                to={queryDates.to}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <DashboardRecentOrders orders={recentOrders} loading={loading} />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <DashboardPaymentTransactions transactions={paymentTransactions} loading={loading} />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#fa8c16' }} />
                    <span>Top sản phẩm bán chạy</span>
                  </Space>
                }
                extra={
                  <Link href={paths.products.list}>
                    <Button type="link" size="small">
                      Xem sản phẩm
                    </Button>
                  </Link>
                }
                variant="borderless"
                style={DASHBOARD_CARD_STYLE}
              >
                {!stats?.topProducts?.length ? (
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
                        render: (value: number) => (
                          <Text style={{ color: '#5856d6', fontWeight: 600 }}>
                            {formatNumber(value)} cái
                          </Text>
                        ),
                      },
                      {
                        title: 'Doanh thu',
                        dataIndex: 'revenue',
                        key: 'revenue',
                        align: 'right',
                        render: (value: number) => (
                          <Text style={{ color: '#52c41a', fontWeight: 600 }}>{formatVND(value)}</Text>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>Cảnh báo tồn kho thấp</span>
                  </Space>
                }
                variant="borderless"
                style={DASHBOARD_CARD_STYLE}
              >
                {!stats?.lowStockAlerts?.length ? (
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
                            <Text strong style={{ fontSize: 13 }}>
                              {item.productName}
                            </Text>
                            {(item.size || item.color) && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {' '}
                                · {item.size} {item.color}
                              </Text>
                            )}
                            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                              Ngưỡng: {formatNumber(item.criticalStock)}
                            </Text>
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

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <InboxOutlined style={{ color: '#1677ff' }} />
                    <span>Gợi ý nhập hàng</span>
                  </Space>
                }
                extra={
                  <Tooltip title="Dựa trên tốc độ bán 30 ngày và lead time 14 ngày">
                    <Text type="secondary">Lookback 30 ngày</Text>
                  </Tooltip>
                }
                variant="borderless"
                style={DASHBOARD_CARD_STYLE}
              >
                {!restockSuggestions.length ? (
                  <Empty description="Chưa có gợi ý nhập hàng" />
                ) : (
                  <Table
                    dataSource={restockSuggestions.slice(0, 8)}
                    rowKey="variantId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 900 }}
                    columns={[
                      {
                        title: 'Sản phẩm',
                        key: 'productName',
                        render: (_, record) => (
                          <div>
                            <Text strong>{record.productName}</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                              {record.sku}
                              {record.size || record.color ? ` · ${record.size ?? ''} ${record.color ?? ''}` : ''}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: 'Tồn hiện tại',
                        dataIndex: 'currentStock',
                        key: 'currentStock',
                        align: 'right',
                        width: 110,
                      },
                      {
                        title: 'Đã bán (30 ngày)',
                        dataIndex: 'soldInLookback',
                        key: 'soldInLookback',
                        align: 'right',
                        width: 130,
                        render: (value: number) => formatNumber(value),
                      },
                      {
                        title: 'TB/ngày',
                        dataIndex: 'avgDailySold',
                        key: 'avgDailySold',
                        align: 'right',
                        width: 90,
                        render: (value: number) => value.toFixed(1),
                      },
                      {
                        title: 'Đề xuất nhập',
                        dataIndex: 'recommendedRestockQty',
                        key: 'recommendedRestockQty',
                        align: 'right',
                        width: 120,
                        render: (value: number) => (
                          <Text strong style={{ color: value > 0 ? '#1677ff' : '#52c41a' }}>
                            {formatNumber(value)}
                          </Text>
                        ),
                      },
                    ]}
                  />
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
