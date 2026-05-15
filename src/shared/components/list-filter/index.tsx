'use client'

import React from 'react'
import { Card, Col, ColProps, Divider, Row, Typography } from 'antd'
import type { CardProps } from 'antd'

const { Text } = Typography

export const LIST_FILTER_GUTTER: [number, number] = [16, 16]

export const LIST_FILTER_SEARCH_FLEX = '2 1 280px'
export const LIST_FILTER_SELECT_FLEX = '1 1 180px'
export const LIST_FILTER_DATE_FLEX = '1 1 260px'
export const LIST_FILTER_INPUT_FLEX = '1 1 200px'
export const LIST_FILTER_ACTIONS_FLEX = '0 0 auto'

export type ListFilterCardProps = CardProps & {
  activeCount?: number
  footer?: React.ReactNode
}

export const ListFilterCard: React.FC<ListFilterCardProps> = ({
  title = 'Bộ lọc',
  extra,
  activeCount,
  footer,
  children,
  style,
  styles,
  ...rest
}) => {
  const resolvedExtra =
    extra ??
    (activeCount != null && activeCount > 0 ? (
      <Text type="secondary">{activeCount} điều kiện</Text>
    ) : undefined)

  return (
    <Card
      size="small"
      title={title}
      extra={resolvedExtra}
      style={{ marginBottom: 16, ...style }}
      styles={{
        body: { paddingTop: 12, paddingBottom: footer ? 12 : 16 },
        ...styles,
      }}
      {...rest}
    >
      {children}
      {footer ? (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {footer}
          </div>
        </>
      ) : null}
    </Card>
  )
}

export const ListFilterGrid: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Row gutter={LIST_FILTER_GUTTER} align="bottom">
    {children}
  </Row>
)

export const ListFilterCol: React.FC<ColProps> = ({ children, style, ...rest }) => (
  <Col style={{ minWidth: 0, ...style }} {...rest}>
    {children}
  </Col>
)

export const ListFilterField: React.FC<{
  label?: string
  children: React.ReactNode
}> = ({ label, children }) => (
  <div style={{ width: '100%' }}>
    {label ? (
      <Text
        type="secondary"
        style={{ display: 'block', marginBottom: 6, fontSize: 12, lineHeight: '18px' }}
      >
        {label}
      </Text>
    ) : null}
    <div className="list-filter-control" style={{ width: '100%' }}>
      {children}
    </div>
  </div>
)

export const ListFilterActions: React.FC<ColProps> = ({
  children,
  style,
  flex = LIST_FILTER_ACTIONS_FLEX,
  ...rest
}) => (
  <ListFilterCol
    flex={flex}
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      marginLeft: 'auto',
      ...style,
    }}
    {...rest}
  >
    {children}
  </ListFilterCol>
)
