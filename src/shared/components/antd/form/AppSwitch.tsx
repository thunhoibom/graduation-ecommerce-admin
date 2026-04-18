import React from 'react'
import { Switch, SwitchProps } from 'antd'

type AppSwitchProps = SwitchProps

const AppSwitch: React.FC<AppSwitchProps> = (props) => {
  return <Switch {...props} />
}

export default AppSwitch
