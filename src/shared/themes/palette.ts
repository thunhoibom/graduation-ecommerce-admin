/**
 * Design system color palette
 * Grouped by functional roles for better maintainability
 */

export const palette = {
  // Brand colors
  brand: {
    primary: '#1677ff',
    secondary: '#001529',
  },

  // Functional colors (Status)
  status: {
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1677ff',
  },

  // Neutral colors
  neutral: {
    text: '#262626',
    textSecondary: '#8c8c8c',
    disabled: '#bfbfbf',
    border: '#d9d9d9',
  },

  // Background colors
  background: {
    layout: '#f5f5f5',
    container: '#ffffff',
  },
}

// Type definitions for palette
export type PaletteType = typeof palette
