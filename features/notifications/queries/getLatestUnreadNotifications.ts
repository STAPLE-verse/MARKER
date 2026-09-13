import { prisma } from "@/lib/db"
import { NotificationListItemDTO } from "../types"
import { mapNotificationRow } from "./mapNotificationRow"

const LATEST_UNREAD_LIMIT = 5

const SELECT = {
  id: true,
  message: true,
  read: true,
  announcement: true,
  createdAt: true,
  routeData: true,
} as const

/** Powers the nav bell's dropdown preview. Scoped to the caller's own recipient rows. */
export async function getLatestUnreadNotifications(userId: number): Promise<NotificationListItemDTO[]> {
  const rows = await prisma.notification.findMany({
    where: { recipients: { some: { id: userId } }, read: false },
    orderBy: { createdAt: "desc" },
    take: LATEST_UNREAD_LIMIT,
    select: SELECT,
  })

  return rows.map(mapNotificationRow)
}
