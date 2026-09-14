import { z } from "zod"
import { NotificationRouteData } from "../types"

export const schemaForkPublishedPayloadSchema = z.object({
  publisherUsername: z.string(),
  forkedTitle: z.string(),
  version: z.string(),
  forkedPid: z.string(),
})

export type SchemaForkPublishedPayload = z.infer<typeof schemaForkPublishedPayloadSchema>

export function renderSchemaForkPublished(
  data: SchemaForkPublishedPayload
): { message: string; routeData: NotificationRouteData } {
  return {
    message: `${data.publisherUsername} published "${data.forkedTitle}" v${data.version}, forked from your schema.`,
    routeData: { path: `/schemas/${data.forkedPid}` },
  }
}
