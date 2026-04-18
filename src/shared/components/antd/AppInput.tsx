import React from 'react'
import { Input, InputProps } from 'antd'

type AppInputProps = InputProps

type AppInputComponent = React.FC<AppInputProps> & {
  TextArea: typeof Input.TextArea
}

const AppInput: AppInputComponent = (props) => {
  return <Input {...props} />
}

AppInput.TextArea = Input.TextArea

export default AppInput
