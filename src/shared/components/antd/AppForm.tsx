import React from 'react'
import { Form, FormProps, FormItemProps } from 'antd'

interface AppFormProps extends FormProps {
  children: React.ReactNode
}

const AppForm: React.FC<AppFormProps> & { Item: React.FC<FormItemProps> } = ({
  children,
  ...props
}) => {
  return (
    <Form layout="vertical" {...props}>
      {children}
    </Form>
  )
}

AppForm.Item = Form.Item

export default AppForm
