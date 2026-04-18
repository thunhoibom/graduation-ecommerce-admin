import React from 'react'
import { Card, CardProps } from 'antd'

type AppCardProps = CardProps

const AppCard: React.FC<AppCardProps> = ({ children, ...props }) => {
  return <Card {...props}>{children}</Card>
}

export default AppCard
