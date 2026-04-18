import React from 'react'
import { Modal, ModalProps } from 'antd'

type AppModalProps = ModalProps

const AppModal: React.FC<AppModalProps> = ({
  children,
  destroyOnClose,
  destroyOnHidden,
  ...props
}) => {
  return (
    <Modal
      {...props}
      destroyOnHidden={destroyOnHidden ?? destroyOnClose}
    >
      {children}
    </Modal>
  )
}

export default AppModal
