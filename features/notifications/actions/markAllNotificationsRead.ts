"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { revalidatePath } from "next/cache"

/**
 * Scoped to the caller's own recipient rows. STAPLE's bulk equivalent
 * (`updateNotificationReadStatusBulk`) takes an entirely caller-supplied
 * `where` with no injected recipient constraint — this takes no input at
 * all, so there's nothing for a caller to widen.
 */
export const markAllNotificationsRead = authenticatedAction(z.object({}), async ({ userId }) => {
  await prisma.notification.updateMany({
    where: { recipients: { some: { id: userId } }, read: false },
    data: { read: true },
  })

  revalidatePath("/notifications")
})
