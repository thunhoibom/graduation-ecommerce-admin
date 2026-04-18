import React from 'react'
import { Tag, TagProps } from 'antd'

type AppTagProps = TagProps

const AppTag: React.FC<AppTagProps> = ({ children, ...props }) => {
  return <Tag {...props}>{children}</Tag>
}

export default AppTag
