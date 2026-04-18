import React from 'react'
import { Dropdown, DropdownProps } from 'antd'

type AppDropdownProps = DropdownProps

const AppDropdown: React.FC<AppDropdownProps> = ({ children, ...props }) => {
  return <Dropdown {...props}>{children}</Dropdown>
}

export default AppDropdown
