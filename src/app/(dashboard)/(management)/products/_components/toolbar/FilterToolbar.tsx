'use client'

import React, { useCallback } from 'react'
import { Input, Select, Button, Space, Row, Col } from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

interface FilterToolbarProps {
  params: Record<string, string | undefined>
  onChange: (params: Record<string, string | undefined>) => void
  categories: { code: string; name: string }[]
  onAddNew: () => void
  onBulkOpen?: () => void
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  params,
  onChange,
  categories,
  onAddNew,
  onBulkOpen,
}) => {
  const handleSearch = useCallback(
    (value: string) => {
      onChange({ ...params, name: value || undefined, pageIndex: '0' })
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

        <Col xs={24} sm={12} md={6} lg={4}>
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

        <Col xs={24} sm={24} md={10} lg={10} style={{ textAlign: 'right' }}>
          <Space size={8}>
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
    </div>
  )
}

export default FilterToolbar
