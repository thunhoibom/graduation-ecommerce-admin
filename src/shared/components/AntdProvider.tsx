'use client'

import React from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { App, ConfigProvider, theme as antdTheme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { SWRConfig } from 'swr'

const { defaultAlgorithm } = antdTheme

const theme = {
    algorithm: defaultAlgorithm,
    token: {
        colorPrimary: '#5856d6',
    },
}

const swrConfig = {
    revalidateOnFocus: false,
}

const AntdProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <AntdRegistry>
            <SWRConfig value={swrConfig}>
                <ConfigProvider theme={theme} locale={viVN}>
                    <App>{children}</App>
                </ConfigProvider>
            </SWRConfig>
        </AntdRegistry>
    )
}

export default AntdProvider