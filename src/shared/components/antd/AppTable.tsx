import React from 'react'
import { Table, TableProps } from 'antd'

type AppTableProps<T> = TableProps<T>

const headerNoWrapComponents = {
  header: {
    cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
    ),
  },
}

function AppTable<T extends object>(props: AppTableProps<T>) {
  const mergedComponents = {
    ...props.components,
    header: {
      ...(typeof props.components?.header === 'object' ? props.components.header : {}),
      ...headerNoWrapComponents.header,
    },
  }
  return (
    <Table
      {...props}
      components={mergedComponents}
      pagination={
        props.pagination !== false
          ? {
              pageSize: 10,
              showSizeChanger: true,
              locale: { items_per_page: '' },
              ...props.pagination,
            }
          : false
      }
    />
  )
}

export default AppTable
