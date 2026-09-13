"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { revalidatePath } from "next/cache"

const setNotificationReadSchema = z.object({
  notificationId: z.number(),
  read: z.boolean(),
})

/**
 * Scoped to the caller's own recipient rows via the `where`, not just the
 * `id`. STAPLE's `updateNotifications` updates any notification by id with
 * no check that the caller is one of its recipients at all — any signed-in
 * user could flip `read` on anyone's notification.
 *
 * Bidirectional — matches STAPLE's `ReadToggle`, which flips the same
 * boolean either way via the same mutation. This is "set read state," not
 * just "mark read": a user can un-read something to come back to later.
 */
export const setNotificationRead = authenticatedAction(setNotificationReadSchema, async ({ input, userId }) => {
  const result = await prisma.notification.updateMany({
    where: { id: input.notificationId, recipients: { some: { id: userId } } },
    data: { read: input.read },
  })

  if (result.count === 0) {
    throw new ActionError("NOT_FOUND", "Notification not found.")
  }

  revalidatePath("/notifications")
})
