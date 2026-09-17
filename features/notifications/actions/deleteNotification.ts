"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { revalidatePath } from "next/cache"

const deleteNotificationSchema = z.object({
  notificationId: z.number(),
})

/**
 * Removes the notification from the caller's own inbox only — not a plain
 * delete-by-id. A `Notification` row can have several recipients at once
 * (e.g. `FORKED_SCHEMA_UPDATED` writes one row shared by every forker of a
 * family); STAPLE's `deleteNotification` does a bare `deleteMany` with no
 * ownership check at all, which would also delete it for every other
 * recipient, not just the caller. This disconnects the caller from the row
 * instead, and only removes the row outright once nobody is left attached.
 *
 * The `where` combines the unique `id` with a `recipients` filter — Prisma's
 * extended-where-unique-input support (stable well before this project's
 * Prisma 7) lets `update` enforce both atomically; a mismatch throws P2025
 * rather than silently updating 0 rows the way `updateMany` would report a
 * count.
 */
export const deleteNotification = authenticatedAction(deleteNotificationSchema, async ({ input, userId }) => {
  let remainingRecipients: number
  try {
    const updated = await prisma.notification.update({
      where: { id: input.notificationId, recipients: { some: { id: userId } }, source: "MARKER" },
      data: { recipients: { disconnect: { id: userId } } },
      select: { recipients: { select: { id: true } } },
    })
    remainingRecipients = updated.recipients.length
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ActionError("NOT_FOUND", "Notification not found.")
    }
    throw error
  }

  if (remainingRecipients === 0) {
    await prisma.notification.delete({ where: { id: input.notificationId } })
  }

  revalidatePath("/notifications")
})
