export const RETURN_REASON_LABEL: Record<string, string> = {
  WRONG_SIZE: 'Sai kích thước',
  DEFECTIVE: 'Sản phẩm lỗi',
  CHANGED_MIND: 'Đổi ý',
  NOT_AS_DESCRIBED: 'Không đúng mô tả',
  OTHER: 'Lý do khác',
}

export const formatReturnReason = (reason?: string | null): string => {
  if (!reason?.trim()) return '—'
  const trimmed = reason.trim()
  return RETURN_REASON_LABEL[trimmed] ?? trimmed
}
