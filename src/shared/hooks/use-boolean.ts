'use client'

import { useCallback, useState } from 'react'

// ----------------------------------------------------------------------

export interface ReturnTypeBoolean {
  value: boolean
  onTrue: () => void
  onFalse: () => void
  onToggle: () => void
  setValue: React.Dispatch<React.SetStateAction<boolean>>
}

export function useBoolean(defaultValue?: boolean): ReturnTypeBoolean {
  const [value, setValue] = useState(!!defaultValue)

  const onTrue = useCallback(() => {
    setValue(true)
  }, [])

  const onFalse = useCallback(() => {
    setValue(false)
  }, [])

  const onToggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  return {
    onFalse,
    onToggle,
    onTrue,
    setValue,
    value,
  }
}
