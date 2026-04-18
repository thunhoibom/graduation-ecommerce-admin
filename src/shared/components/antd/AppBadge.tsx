import React from 'react'
import { Badge, BadgeProps } from 'antd'

type AppBadgeProps = BadgeProps

const AppBadge: React.FC<AppBadgeProps> = ({ children, ...props }) => {
  return <Badge {...props}>{children}</Badge>
}

export default AppBadge
