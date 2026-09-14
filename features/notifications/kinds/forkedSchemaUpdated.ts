import { z } from "zod"
import { NotificationRouteData } from "../types"

export const forkedSchemaUpdatedPayloadSchema = z.object({
  publisherUsername: z.string(),
  originalTitle: z.string(),
  version: z.string(),
  originalPid: z.string(),
})

export type ForkedSchemaUpdatedPayload = z.infer<typeof forkedSchemaUpdatedPayloadSchema>

export function renderForkedSchemaUpdated(
  data: ForkedSchemaUpdatedPayload
): { message: string; routeData: NotificationRouteData } {
  return {
    message: `${data.publisherUsername} published a new version of "${data.originalTitle}" (v${data.version}), which you forked from.`,
    routeData: { path: `/schemas/${data.originalPid}` },
  }
}
