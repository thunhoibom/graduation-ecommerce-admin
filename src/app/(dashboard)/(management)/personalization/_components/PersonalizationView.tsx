'use client'

import React, { useMemo, useState } from 'react'
import { Alert, Button, Card, InputNumber, Space, Spin, Typography, message } from 'antd'
import { useAxiosSWR } from '@/shared/hooks/use-axios-swr'
import { SWR_KEYS } from '@/constants/swrKeys'
import { getParamsByCategory, updateParam, type ParamPojo } from '@/services/rest-api/app-api/settings/settings-service'

const { Title, Text } = Typography

type RuleKey = 'category_boost' | 'cart_boost' | 'purchase_boost' | 'fallback_boost'

const RULE_LABELS: Record<RuleKey, string> = {
  category_boost: 'Category affinity boost',
  cart_boost: 'Add-to-cart boost',
  purchase_boost: 'Purchase boost',
  fallback_boost: 'Fallback bestseller boost',
}

export default function PersonalizationView() {
  const [messageApi, contextHolder] = message.useMessage()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<Record<RuleKey, number>>>({})

  const { data, isLoading, mutate } = useAxiosSWR(
    [SWR_KEYS.PARAMS_BY_CATEGORY, 'personalization'],
    async () => getParamsByCategory('personalization'),
    { revalidateOnMount: true }
  )

  const rows = useMemo(() => {
    const params = data?.data ?? []
    return params.filter((p) => Object.hasOwn(RULE_LABELS, p.name as RuleKey))
  }, [data])

  const handleSave = async () => {
    const changedRows = rows.filter((row) => draft[row.name as RuleKey] != null && row.id != null)
    if (!changedRows.length) {
      messageApi.info('Chưa có thay đổi để lưu.')
      return
    }
    setSaving(true)
    try {
      await Promise.all(
        changedRows.map((row) => {
          const next = draft[row.name as RuleKey]
          const payload: ParamPojo = {
            ...row,
            value: String(next),
          }
          return updateParam(row.id!, payload)
        })
      )
      messageApi.success('Đã cập nhật rule personalization.')
      setDraft({})
      mutate()
    } catch {
      messageApi.error('Không thể lưu cấu hình personalization.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Personalization (MVP+)
          </Title>
          <Text type="secondary">
            Điều chỉnh nhanh trọng số recommendation cho Home/Search/PDP/Cart/Checkout success.
          </Text>
        </div>

        <Alert
          type="info"
          showIcon
          message="MVP scope"
          description="Trang này dùng category = personalization trong params. Nếu chưa có seed data, hãy thêm các key cơ bản ở backend migrations."
        />

        <Card>
          <Spin spinning={isLoading || saving}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {rows.map((row) => {
                const key = row.name as RuleKey
                const current = Number(row.value)
                const value = draft[key] ?? current
                return (
                  <div key={row.id ?? row.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <Text strong>{RULE_LABELS[key]}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Param key: <code>{row.name}</code>
                      </Text>
                    </div>
                    <InputNumber
                      min={0}
                      max={10}
                      step={0.1}
                      value={value}
                      onChange={(next) => {
                        if (typeof next === 'number') {
                          setDraft((prev) => ({ ...prev, [key]: next }))
                        }
                      }}
                    />
                  </div>
                )
              })}

              {!rows.length && !isLoading && (
                <Text type="secondary">Chưa có tham số personalization trong hệ thống.</Text>
              )}
            </Space>
          </Spin>
        </Card>

        <div>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Lưu cấu hình
          </Button>
        </div>
      </Space>
    </>
  )
}
