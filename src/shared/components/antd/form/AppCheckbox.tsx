import React from 'react'
import { Checkbox, CheckboxProps } from 'antd'

type AppCheckboxProps = CheckboxProps

const AppCheckbox: React.FC<AppCheckboxProps> = (props) => {
  return <Checkbox {...props} />
}

export default AppCheckbox
