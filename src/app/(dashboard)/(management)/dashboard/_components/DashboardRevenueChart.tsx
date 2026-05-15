'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Empty, Row, Segmented, Space, Spin, Typography } from 'antd'
import { RiseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RevenueGroupBy, RevenueStatPojo } from '../types'
import { dashboardService } from '../_services/dashboard-service'
import { DASHBOARD_CARD_STYLE, formatNumber, formatVND } from './dashboard-utils'

const { Text } = Typography

type DashboardRevenueChartProps = {
  fallbackSeries: RevenueStatPojo[]
  from?: string
  to?: string
}

type RevenueChartPoint = RevenueStatPojo & {
  label: string
}

const formatPeriodLabel = (date: string, groupBy: RevenueGroupBy) => {
  const parsed = dayjs(date)
  if (!parsed.isValid()) return date
  if (groupBy === 'month') return parsed.format('MM/YYYY')
  if (groupBy === 'week') return `Tuần ${parsed.format('DD/MM')}`
  return parsed.format('DD/MM')
}

const formatRevenueAxis = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)} n`
  return formatNumber(value)
}

const RevenueTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: RevenueChartPoint }>
}) => {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: '10px 12px',
      }}
    >
      <Text strong style={{ display: 'block', marginBottom: 4 }}>
        {point.label}
      </Text>
      <Text style={{ display: 'block', color: '#52c41a' }}>
        Doanh thu thuần: {formatVND(point.revenue)}
      </Text>
      <Text style={{ display: 'block', color: '#5856d6' }}>
        Đơn hàng: {formatNumber(point.orderCount)}
      </Text>
    </div>
  )
}

const DashboardRevenueChart: React.FC<DashboardRevenueChartProps> = ({
  fallbackSeries,
  from,
  to,
}) => {
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>('day')
  const [series, setSeries] = useState<RevenueStatPojo[]>(fallbackSeries)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSeries(fallbackSeries)
    setGroupBy('day')
  }, [fallbackSeries, from, to])

  useEffect(() => {
    if (groupBy === 'day') {
      setSeries(fallbackSeries)
      return
    }

    let cancelled = false
    const loadRevenue = async () => {
      setLoading(true)
      try {
        const data = await dashboardService.getRevenue({ from, to, groupBy })
        if (!cancelled) {
          setSeries(data ?? [])
        }
      } catch {
        if (!cancelled) {
          setSeries(fallbackSeries)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRevenue()
    return () => {
      cancelled = true
    }
  }, [fallbackSeries, from, groupBy, to])

  const visibleSeries = series.slice(-12)
  const chartData = useMemo<RevenueChartPoint[]>(
    () => visibleSeries.map((item) => ({
      ...item,
      label: formatPeriodLabel(item.date, groupBy),
    })),
    [groupBy, visibleSeries],
  )
  const totalRevenue = visibleSeries.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = visibleSeries.reduce((sum, item) => sum + item.orderCount, 0)

  return (
    <Card
      title={
        <Space>
          <RiseOutlined style={{ color: '#52c41a' }} />
          <span>Doanh thu thuần theo thời gian</span>
        </Space>
      }
      extra={
        <Segmented
          size="small"
          value={groupBy}
          onChange={(value) => setGroupBy(value as RevenueGroupBy)}
          options={[
            { label: 'Ngày', value: 'day' },
            { label: 'Tuần', value: 'week' },
            { label: 'Tháng', value: 'month' },
          ]}
        />
      }
      variant="borderless"
      style={DASHBOARD_CARD_STYLE}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : visibleSeries.length === 0 ? (
        <Empty description="Không có dữ liệu doanh thu" />
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Text type="secondary">Doanh thu thuần hiển thị</Text>
              <Text strong style={{ display: 'block', fontSize: 18, color: '#52c41a' }}>
                {formatVND(totalRevenue)}
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text type="secondary">Tổng đơn trong biểu đồ</Text>
              <Text strong style={{ display: 'block', fontSize: 18, color: '#5856d6' }}>
                {formatNumber(totalOrders)} đơn
              </Text>
            </Col>
          </Row>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#8c8c8c' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="revenue"
                  tickFormatter={formatRevenueAxis}
                  tick={{ fontSize: 11, fill: '#8c8c8c' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#8c8c8c' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#52c41a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orderCount"
                  name="Đơn hàng"
                  stroke="#5856d6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#5856d6' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}

export default DashboardRevenueChart
