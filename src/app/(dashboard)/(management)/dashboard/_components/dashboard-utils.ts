export const DASHBOARD_CARD_STYLE = {
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
} as const

export const formatVND = (value: number | undefined) => {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatNumber = (value: number | undefined) => {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat('vi-VN').format(value)
}
