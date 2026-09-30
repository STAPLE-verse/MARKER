import { prisma } from "@/lib/db"
import { createNotificationDigestMsg, DigestFrequency } from "@/lib/emails"
import { sendEmail } from "@/lib/mailer"
import { NotificationRouteData } from "../types"

const WINDOW_MS: Record<DigestFrequency, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
}

// Same spacing STAPLE's mailers use, to stay under Resend's per-second limit.
const DELAY_BETWEEN_EMAILS_MS = 500

export interface NotificationDigestResult {
  frequency: DigestFrequency
  recipients: number
  sent: number
  failed: number
}

/**
 * MARKER's counterpart to STAPLE's `cron/cronJobDailyMailer.mjs` and
 * `cronJobWeeklyMailer.mjs`: emails each person a roundup of the MARKER
 * notifications they received in the last day / week.
 *
 * Who gets which roundup is read from the STAPLE profile setting
 * `User.emailProjectActivityFrequency` (the shared User table) — MARKER has
 * no setting of its own. The DAILY run emails only people set to DAILY, the
 * WEEKLY run only people set to WEEKLY, and NEVER is matched by neither.
 * People with nothing new in the window get no email.
 *
 * Not a server action: it is only run by the scheduled route
 * (`app/api/cron/notification-digest`).
 */
export async function sendNotificationDigest(
  frequency: DigestFrequency,
  { now = new Date(), delayMs = DELAY_BETWEEN_EMAILS_MS }: { now?: Date; delayMs?: number } = {}
): Promise<NotificationDigestResult> {
  const recent = { source: "MARKER" as const, createdAt: { gte: new Date(now.getTime() - WINDOW_MS[frequency]) } }

  const users = await prisma.user.findMany({
    where: { emailProjectActivityFrequency: frequency, notifications: { some: recent } },
    select: {
      email: true,
      notifications: {
        where: recent,
        orderBy: { createdAt: "desc" },
        select: { message: true, routeData: true },
      },
    },
  })

  const result: NotificationDigestResult = { frequency, recipients: 0, sent: 0, failed: 0 }

  for (const user of users) {
    if (!user.email) continue
    if (result.recipients > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
    result.recipients++

    const outcome = await sendEmail(
      createNotificationDigestMsg({
        to: user.email,
        frequency,
        notifications: user.notifications.map((notification) => ({
          message: notification.message,
          path: (notification.routeData as NotificationRouteData | null)?.path ?? null,
        })),
      })
    )
    if (outcome.success) result.sent++
    else result.failed++
  }

  return result
}
