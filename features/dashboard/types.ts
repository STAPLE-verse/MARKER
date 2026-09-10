export interface DashboardStatsDTO {
  publishedCount: number
  draftCount: number
  archivedCount: number
}

export type ActivityType = "CREATED" | "IMPORTED_STAPLE" | "FORKED" | "PUBLISHED"

/**
 * One row in the dashboard's Recent Activity feed. Each `type` comes from a
 * distinct, already-existing timestamp column (see `getRecentActivity.ts`) —
 * there's no dedicated activity-log table, so this DTO is assembled by
 * merging four separate queries rather than read from one.
 */
export interface ActivityItemDTO {
  type: ActivityType
  /** Schema title at the time of the event (its current display name). */
  title: string
  /** Set only for PUBLISHED — the version string, e.g. "1.2.0". */
  version: string | null
  timestamp: Date
  /** Where clicking this row should take the user. */
  href: string
}
