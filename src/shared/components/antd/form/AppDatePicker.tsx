import React from 'react'
import { DatePicker, DatePickerProps } from 'antd'

type AppDatePickerProps = DatePickerProps

const AppDatePicker: React.FC<AppDatePickerProps> = (props) => {
  return <DatePicker {...props} style={{ width: '100%', ...props.style }} />
}

export default AppDatePicker
