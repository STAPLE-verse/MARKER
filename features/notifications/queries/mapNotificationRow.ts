import { NotificationListItemDTO, NotificationRouteData } from "../types"

interface NotificationRow {
  id: number
  message: string
  read: boolean
  announcement: boolean
  createdAt: Date
  routeData: unknown
}

export function mapNotificationRow(row: NotificationRow): NotificationListItemDTO {
  return {
    id: row.id,
    message: row.message,
    read: row.read,
    announcement: row.announcement,
    createdAt: row.createdAt,
    routeData: (row.routeData as NotificationRouteData | null) ?? null,
  }
}
