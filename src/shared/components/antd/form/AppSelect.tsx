import React from 'react'
import { Select, SelectProps } from 'antd'

type AppSelectProps = SelectProps

const AppSelect: React.FC<AppSelectProps> = (props) => {
  return <Select {...props} style={{ width: '100%', ...props.style }} />
}

export default AppSelect
