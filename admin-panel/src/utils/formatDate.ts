export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

export const formatDateShort = (value: string | Date | null | undefined): string => {
  if (!value) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString()
}
