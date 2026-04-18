/**
 * Format date string from YYYY-MM-DD format to DD/MM/YYYY format
 * @param value - Date string in format "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss"
 * @returns Formatted date string in DD/MM/YYYY format, or empty string if value is empty, or original value if parsing fails
 */
export const formatDate = (value?: string): string => {
  if (!value) return ''
  const datePart = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
