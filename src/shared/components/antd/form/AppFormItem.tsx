import React from 'react'
import { Form, FormItemProps } from 'antd'

type AppFormItemProps = FormItemProps

const AppFormItem: React.FC<AppFormItemProps> = (props) => {
  return <Form.Item {...props} />
}

export default AppFormItem
