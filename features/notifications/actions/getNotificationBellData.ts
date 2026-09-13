"use server"

import { z } from "zod"
import { authenticatedAction } from "@/utils/safe-action"
import { getUnreadNotificationsCount } from "../queries/getUnreadNotificationsCount"
import { getLatestUnreadNotifications } from "../queries/getLatestUnreadNotifications"

/**
 * The nav bell's poll target. A "use server" action (unlike the read-only
 * `queries/`, which are plain functions called directly from Server
 * Components) because the bell is a client component and needs an RPC
 * boundary to refresh itself without a full page navigation — STAPLE's bell
 * has no refresh path at all outside of one unrelated event and manual
 * mark-as-read refetches, so this is a genuine improvement, not a port.
 */
export const getNotificationBellData = authenticatedAction(z.object({}), async ({ userId }) => {
  const [unreadCount, latest] = await Promise.all([
    getUnreadNotificationsCount(userId),
    getLatestUnreadNotifications(userId),
  ])

  return { unreadCount, latest }
})
