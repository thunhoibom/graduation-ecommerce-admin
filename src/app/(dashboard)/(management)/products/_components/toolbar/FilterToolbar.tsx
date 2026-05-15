'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Input,
  Select,
  Button,
  Space,
  InputNumber,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  ListFilterCard,
  ListFilterCol,
  ListFilterField,
  ListFilterGrid,
  LIST_FILTER_INPUT_FLEX,
  LIST_FILTER_SEARCH_FLEX,
  LIST_FILTER_SELECT_FLEX,
} from '@/shared/components/list-filter'

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
  const keywordFromParams = params.query ?? params.name ?? ''
  const barcodeFromParams = params.barcodeLike ?? ''
  const [keywordDraft, setKeywordDraft] = useState(keywordFromParams)
  const [barcodeDraft, setBarcodeDraft] = useState(barcodeFromParams)

  useEffect(() => {
    setKeywordDraft(keywordFromParams)
  }, [keywordFromParams])

  useEffect(() => {
    setBarcodeDraft(barcodeFromParams)
  }, [barcodeFromParams])

  const keyword = keywordFromParams

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
      setKeywordDraft(v)
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
      setBarcodeDraft(v)
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
    <ListFilterCard
      activeCount={activeFilterCount}
      footer={(
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Xóa lọc
          </Button>
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
      )}
    >
      <ListFilterGrid>
        <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
          <ListFilterField label="Từ khóa">
            <Input.Search
              placeholder="Tên, mô tả, danh mục…"
              allowClear
              enterButton={<SearchOutlined />}
              value={keywordDraft}
              onSearch={handleKeywordSearch}
              onChange={(e) => {
                const next = e.target.value
                setKeywordDraft(next)
                if (!next) {
                  handleKeywordSearch('')
                }
              }}
            />
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_SEARCH_FLEX}>
          <ListFilterField label="Barcode">
            <Input.Search
              placeholder="Barcode (gần đúng)"
              allowClear
              enterButton={<SearchOutlined />}
              value={barcodeDraft}
              onSearch={handleBarcodeLike}
              onChange={(e) => {
                const next = e.target.value
                setBarcodeDraft(next)
                if (!next) {
                  handleBarcodeLike('')
                }
              }}
            />
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
          <ListFilterField label="Danh mục">
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
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
          <ListFilterField label="Trạng thái">
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
          </ListFilterField>
        </ListFilterCol>
      </ListFilterGrid>

      <div style={{ height: 16 }} />

      <ListFilterGrid>
        <ListFilterCol flex={LIST_FILTER_INPUT_FLEX}>
          <ListFilterField label="Giá tối thiểu">
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
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_INPUT_FLEX}>
          <ListFilterField label="Giá tối đa">
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
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
          <ListFilterField label="Tồn kho">
            <Select
              placeholder="Tồn kho"
              allowClear
              style={{ width: '100%' }}
              value={params.inStock === 'true' ? 'true' : undefined}
              options={[{ label: 'Chỉ còn hàng', value: 'true' }]}
              onChange={handleInStock}
            />
          </ListFilterField>
        </ListFilterCol>
        <ListFilterCol flex={LIST_FILTER_SELECT_FLEX}>
          <ListFilterField label="Sắp xếp">
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
          </ListFilterField>
        </ListFilterCol>
      </ListFilterGrid>
    </ListFilterCard>
  )
}

export default FilterToolbar
