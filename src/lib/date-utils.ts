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

/** The viewer's local calendar date as YYYY-MM-DD. */
export function todayDateString(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Start of "today" for deadline checks. Deadlines are calendar dates stored
 * at UTC midnight (see parseLocalDate), so "today" is UTC midnight of the
 * viewer's local date. A task is overdue only when its deadline is before
 * this, so tasks due today are not overdue.
 *
 * `today` is a YYYY-MM-DD string from the client; without it (or when it is
 * invalid) the server falls back to the current UTC date.
 */
export function todayStart(today?: string): Date {
  if (today) {
    const date = parseLocalDate(today)
    if (!Number.isNaN(date.getTime())) return date
  }
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now
}
