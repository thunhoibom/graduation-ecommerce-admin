'use client'

import React, { useCallback, useMemo } from 'react'
import {
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Card,
  InputNumber,
  Typography,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface FilterToolbarProps {
  params: Record<string, string | undefined>
  onChange: (params: Record<string, string | undefined>) => void
  categories: { code: string; name: string }[]
  onAddNew: () => void
  onBulkOpen?: () => void
  /** Replace URL query with only pagination (clears all filters). */
  onClearFilters?: () => void
}

const SORT_OPTIONS = [
  { label: 'Mặc định', sortBy: undefined, order: undefined as string | undefined },
  { label: 'Tên (A–Z)', sortBy: 'name', order: 'asc' },
  { label: 'Tên (Z–A)', sortBy: 'name', order: 'desc' },
  { label: 'Giá tăng dần', sortBy: 'price', order: 'asc' },
  { label: 'Giá giảm dần', sortBy: 'price', order: 'desc' },
  { label: 'Barcode (A–Z)', sortBy: 'barcode', order: 'asc' },
  { label: 'Danh mục (A–Z)', sortBy: 'category', order: 'asc' },
]

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  params,
  onChange,
  categories,
  onAddNew,
  onBulkOpen,
  onClearFilters,
}) => {
  const keyword = params.query ?? params.name ?? ''

  const sortValue = useMemo(() => {
    const sb = params.sortBy
    const od = params.order
    if (!sb || !od) return ''
    const hit = SORT_OPTIONS.find((o) => o.sortBy === sb && o.order === od)
    return hit ? `${sb}:${od}` : ''
  }, [params.sortBy, params.order])

  const handleKeywordSearch = useCallback(
    (value: string) => {
      const v = value.trim()
      onChange({
        ...params,
        name: undefined,
        query: v || undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleBarcodeLike = useCallback(
    (value: string) => {
      const v = value.trim()
      onChange({
        ...params,
        barcodeLike: v || undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleCategoryChange = useCallback(
    (value: string | undefined) => {
      onChange({ ...params, categoryCode: value || undefined, pageIndex: '0' })
    },
    [onChange, params],
  )

  const handleStatusChange = useCallback(
    (value: string | undefined) => {
      onChange({ ...params, status: value || undefined, pageIndex: '0' })
    },
    [onChange, params],
  )

  const handleMinPrice = useCallback(
    (v: number | null) => {
      onChange({
        ...params,
        minPrice: v != null && v > 0 ? String(Math.round(v)) : undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleMaxPrice = useCallback(
    (v: number | null) => {
      onChange({
        ...params,
        maxPrice: v != null && v > 0 ? String(Math.round(v)) : undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleInStock = useCallback(
    (value: string | undefined) => {
      onChange({
        ...params,
        inStock: value === 'true' ? 'true' : undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleSortChange = useCallback(
    (value: string) => {
      if (!value) {
        onChange({
          ...params,
          sortBy: undefined,
          order: undefined,
          pageIndex: '0',
        })
        return
      }
      const [sortBy, order] = value.split(':')
      onChange({
        ...params,
        sortBy: sortBy || undefined,
        order: (order as 'asc' | 'desc') || undefined,
        pageIndex: '0',
      })
    },
    [onChange, params],
  )

  const handleReset = useCallback(() => {
    if (onClearFilters) {
      onClearFilters()
      return
    }
    const pageSize = params.pageSize ?? '20'
    onChange({
      pageIndex: '0',
      pageSize,
    })
  }, [onChange, onClearFilters, params.pageSize])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (keyword) n++
    if (params.barcodeLike) n++
    if (params.categoryCode) n++
    if (params.status) n++
    if (params.minPrice) n++
    if (params.maxPrice) n++
    if (params.inStock === 'true') n++
    if (params.sortBy && params.order) n++
    return n
  }, [
    keyword,
    params.barcodeLike,
    params.categoryCode,
    params.status,
    params.minPrice,
    params.maxPrice,
    params.inStock,
    params.sortBy,
    params.order,
  ])

  return (
    <Card
      size="small"
      title="Bộ lọc"
      extra={
        activeFilterCount > 0 ? (
          <Text type="secondary">{activeFilterCount} điều kiện</Text>
        ) : null
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} lg={10}>
          <Input.Search
            placeholder="Từ khóa: tên, mô tả, danh mục…"
            allowClear
            enterButton={<SearchOutlined />}
            value={keyword}
            onSearch={handleKeywordSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleKeywordSearch('')
              }
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Input.Search
            placeholder="Barcode (gần đúng)"
            allowClear
            enterButton={<SearchOutlined />}
            value={params.barcodeLike ?? ''}
            onSearch={handleBarcodeLike}
            onChange={(e) => {
              if (!e.target.value) {
                handleBarcodeLike('')
              }
            }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Select
            placeholder="Danh mục"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            value={params.categoryCode}
            options={categories.map((c) => ({
              label: c.name,
              value: c.code,
            }))}
            onChange={handleCategoryChange}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: '100%' }}
            value={params.status}
            options={[
              { label: 'Bản nháp', value: 'DRAFT' },
              { label: 'Đang bán', value: 'PUBLISHED' },
              { label: 'Ngừng bán', value: 'UNLISTED' },
            ]}
            onChange={handleStatusChange}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      <Row gutter={[12, 12]} align="middle">
        <Col xs={12} sm={8} md={5}>
          <InputNumber
            placeholder="Giá tối thiểu (₫)"
            style={{ width: '100%' }}
            min={0}
            step={1000}
            formatter={(v) => (v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
            parser={(v) => (v ? Number(v.replace(/\./g, '')) : 0)}
            value={params.minPrice ? Number(params.minPrice) : undefined}
            onChange={(v) => handleMinPrice(v)}
          />
        </Col>
        <Col xs={12} sm={8} md={5}>
          <InputNumber
            placeholder="Giá tối đa (₫)"
            style={{ width: '100%' }}
            min={0}
            step={1000}
            formatter={(v) => (v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
            parser={(v) => (v ? Number(v.replace(/\./g, '')) : 0)}
            value={params.maxPrice ? Number(params.maxPrice) : undefined}
            onChange={(v) => handleMaxPrice(v)}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Select
            placeholder="Tồn kho"
            allowClear
            style={{ width: '100%' }}
            value={params.inStock === 'true' ? 'true' : undefined}
            options={[{ label: 'Chỉ còn hàng', value: 'true' }]}
            onChange={handleInStock}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Sắp xếp"
            allowClear
            style={{ width: '100%' }}
            value={sortValue || undefined}
            options={SORT_OPTIONS.filter((o) => o.sortBy).map((o) => ({
              label: o.label,
              value: `${o.sortBy}:${o.order}`,
            }))}
            onChange={(v) => handleSortChange(v ?? '')}
          />
        </Col>
        <Col xs={24} md={4} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Xóa lọc
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      <Row justify="end">
        <Col>
          <Space wrap>
            <Button icon={<FileTextOutlined />} onClick={onBulkOpen}>
              Dữ liệu (CSV)
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddNew}
              style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
            >
              Thêm sản phẩm
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default FilterToolbar
