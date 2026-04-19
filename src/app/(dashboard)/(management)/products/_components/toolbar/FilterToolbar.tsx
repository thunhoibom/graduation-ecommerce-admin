'use client'

import React, { useCallback } from 'react'
import { Input, Select, Button, Space, Row, Col } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'

interface FilterToolbarProps {
  params: Record<string, string | undefined>
  onChange: (params: Record<string, string | undefined>) => void
  categories: { code: string; name: string }[]
  onAddNew: () => void
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  params,
  onChange,
  categories,
  onAddNew,
}) => {
  const handleSearch = useCallback(
    (value: string) => {
      onChange({ name: value || undefined, page: '1' })
    },
    [onChange],
  )

  const handleCategoryChange = useCallback(
    (value: string | undefined) => {
      onChange({ categoryCode: value || undefined, page: '1' })
    },
    [onChange],
  )

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input.Search
            placeholder="Tìm theo tên, barcode..."
            allowClear
            enterButton={<SearchOutlined />}
            defaultValue={params.name ?? ''}
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch('')
              }
            }}
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
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

        <Col xs={24} sm={24} md={10} lg={14} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddNew}
            style={{ backgroundColor: '#5856d6', borderColor: '#5856d6' }}
          >
            Thêm sản phẩm
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default FilterToolbar
