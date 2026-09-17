import { prisma } from "@/lib/db"
import { NotificationListItemDTO } from "../types"
import { mapNotificationRow } from "./mapNotificationRow"

// Fetches the full (bounded) list and lets the `/notifications` page paginate
// client-side via DataTable — same pattern as `getUserForms`/
// `getUserPublishedSchemas`, not real server-side pagination.
const NOTIFICATIONS_LIST_LIMIT = 200

/**
 * Owner-scoped notification list for the `/notifications` page. Unlike
 * STAPLE's `getNotifications` (a caller-supplied `where`/`orderBy`/`include`
 * passthrough with no injected recipient filter), this takes only a userId —
 * there's no `where` parameter a caller could use to read someone else's rows.
 */
export async function getNotifications(userId: number): Promise<NotificationListItemDTO[]> {
  const rows = await prisma.notification.findMany({
    where: { recipients: { some: { id: userId } }, source: "MARKER" },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATIONS_LIST_LIMIT,
    select: {
      id: true,
      message: true,
      read: true,
      announcement: true,
      createdAt: true,
      routeData: true,
    },
  })

  return rows.map(mapNotificationRow)
}
