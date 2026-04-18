import React from 'react'
import { Button, ButtonProps } from 'antd'

type AppButtonProps = ButtonProps

const AppButton: React.FC<AppButtonProps> = ({ children, ...props }) => {
  return <Button {...props}>{children}</Button>
}

export default AppButton
