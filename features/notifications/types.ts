/**
 * Same generic shape as STAPLE's `Notification.routeData` column — kept
 * generic at the DB/DTO level since the schemas converge, but in MARKER's
 * own code only a kind's `render()` ever constructs one (see kinds/index.ts).
 * Trigger call sites never build a path string themselves.
 */
export interface NotificationRouteData {
  path: string
  params?: Record<string, string | number>
}

export interface NotificationListItemDTO {
  id: number
  message: string
  read: boolean
  announcement: boolean
  createdAt: Date
  routeData: NotificationRouteData | null
}
