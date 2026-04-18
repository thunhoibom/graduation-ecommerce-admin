import React from 'react'
import { Radio, RadioProps, RadioGroupProps } from 'antd'

type AppRadioProps = RadioProps

const AppRadio: React.FC<AppRadioProps> & {
  Group: React.FC<RadioGroupProps>
} = (props) => {
  return <Radio {...props} />
}

AppRadio.Group = Radio.Group

export default AppRadio
