'use client'

import React, { useMemo } from 'react'
import { Empty, Space, Tag, Typography } from 'antd'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { OrderStatusCountPojo } from '../types'
import {
  FULFILLMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  normalizeOrderStatus,
} from '@/constants/order-status'
import { formatNumber } from './dashboard-utils'

const { Text } = Typography

const STATUS_CONFIG = {
  ...FULFILLMENT_STATUS_CONFIG,
  ...PAYMENT_STATUS_CONFIG,
}

const CHART_COLORS = [
  '#52c41a',
  '#5856d6',
  '#1890ff',
  '#faad14',
  '#ff4d4f',
  '#13c2c2',
  '#722ed1',
  '#eb2f96',
  '#2f54eb',
  '#a0d911',
]

type DashboardOrderStatusChartProps = {
  items: OrderStatusCountPojo[]
  totalOrders: number
}

type StatusChartPoint = {
  status: string
  label: string
  count: number
  color: string
}

const StatusTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: StatusChartPoint }>
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
      <Text style={{ display: 'block' }}>
        {formatNumber(point.count)} đơn
      </Text>
    </div>
  )
}

const DashboardOrderStatusChart: React.FC<DashboardOrderStatusChartProps> = ({
  items,
  totalOrders,
}) => {
  const chartData = useMemo<StatusChartPoint[]>(
    () => items.map((item, index) => {
      const statusKey = normalizeOrderStatus(item.status)
      const statusConfig = STATUS_CONFIG[statusKey]
      return {
        status: item.status,
        label: statusConfig?.label ?? item.status,
        count: item.count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    }),
    [items],
  )

  if (!chartData.length) {
    return <Empty description="Không có dữ liệu" />
  }

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 220, marginBottom: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
            >
              {chartData.map((item) => (
                <Cell key={item.status} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <Space orientation="vertical" size={12} style={{ width: '100%', paddingTop: 4 }}>
        {chartData.map((item) => {
          const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
          return (
            <div key={item.status}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Tag color={STATUS_CONFIG[normalizeOrderStatus(item.status)]?.color ?? 'default'}>
                  {item.label}
                </Tag>
                <Text strong>{formatNumber(item.count)} đơn ({pct}%)</Text>
              </div>
            </div>
          )
        })}
      </Space>
    </Space>
  )
}

export default DashboardOrderStatusChart
