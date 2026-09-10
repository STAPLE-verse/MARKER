const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
]

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

/**
 * "2 hours ago" / "in 3 days" style label for activity feeds. `now` is
 * injectable so tests don't depend on the wall clock.
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime()
  const absMs = Math.abs(diffMs)

  if (absMs < 60 * 1000) return "just now"

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit)
    }
  }
  return rtf.format(Math.round(diffMs / (60 * 1000)), "minute")
}
