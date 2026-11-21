export function parseLocalDate(dateStr: string): Date {
  // Missing parts become NaN, which yields an Invalid Date (same as before).
  const [year = NaN, month = NaN, day = NaN] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatLocalDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function timestampToLocalDateString(timestamp: number): string {
  return formatLocalDate(new Date(timestamp))
}
