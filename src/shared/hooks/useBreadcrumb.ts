'use client'

import { useEffect } from 'react'
import { BreadcrumbItem, useBreadcrumbContext } from '../contexts/BreadcrumbContext'

export const useBreadcrumb = (items: BreadcrumbItem[]) => {
    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems(items)
        return () => {
            setItems([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(items)])
}
