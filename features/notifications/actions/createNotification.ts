import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { NOTIFICATION_KINDS, NotificationKind, NotificationKindPayloadMap } from "../kinds"

/**
 * Writes a notification row. Deliberately NOT a "use server" action — unlike
 * STAPLE's `sendNotification` mutation (callable by any authenticated client
 * with arbitrary recipient IDs and no check that they belong to the caller's
 * project), this has no client-facing RPC surface at all. It's only ever
 * called from trusted server-side trigger code that already knows the
 * correct recipients from its own authorized query (e.g. `forkSchema.ts`
 * already loaded the original schema's `authorId` before this runs).
 */
export async function createNotification<K extends NotificationKind>(params: {
  recipients: number[]
  kind: K
  data: NotificationKindPayloadMap[K]
}): Promise<void> {
  if (params.recipients.length === 0) return

  const definition = NOTIFICATION_KINDS[params.kind]
  const payload = definition.payloadSchema.parse(params.data)
  const { message, routeData } = definition.render(payload)

  await prisma.notification.create({
    data: {
      message,
      routeData: routeData as unknown as Prisma.InputJsonValue,
      recipients: { connect: params.recipients.map((id) => ({ id })) },
    },
  })
}
