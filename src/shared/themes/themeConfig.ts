import type { ThemeConfig } from 'antd'
import { palette } from './palette'

const theme: ThemeConfig = {
  token: {
    colorPrimary: palette.brand.primary,
    colorSuccess: palette.status.success,
    colorWarning: palette.status.warning,
    colorError: palette.status.error,
    colorInfo: palette.status.info,
    colorTextBase: palette.neutral.text,
    borderRadius: 6,
    fontFamily:
      'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  components: {
    Button: {
      borderRadius: 4,
    },
    Input: {
      borderRadius: 4,
    },
    Form: {
      itemMarginBottom: 16,
    },
    Layout: {
      bodyBg: palette.background.layout,
      headerBg: palette.background.container,
    },
  },
}

export default theme
