import React from 'react'
import { Modal, ModalProps } from 'antd'

type AppModalProps = ModalProps

const AppModal: React.FC<AppModalProps> = ({
  children,
  destroyOnHidden,
  destroyOnHidden,
  ...props
}) => {
  return (
    <Modal
      {...props}
      destroyOnHidden={destroyOnHidden ?? destroyOnHidden}
    >
      {children}
    </Modal>
  )
}

export default AppModal
