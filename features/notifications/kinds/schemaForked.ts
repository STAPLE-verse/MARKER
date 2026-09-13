import { z } from "zod"
import { NotificationRouteData } from "../types"

export const schemaForkedPayloadSchema = z.object({
  forkedByUsername: z.string(),
  originalTitle: z.string(),
  // Route target: prefer the original author's own draft; fall back to the
  // public catalog page on the rare row whose origin draft has since been
  // deleted (originFormVersionId is onDelete: SetNull) — same fallback
  // `getRecentActivity.ts` and `getUserPublishedSchemas` mapping use.
  originalFormId: z.number().nullable(),
  originalPid: z.string(),
})

export type SchemaForkedPayload = z.infer<typeof schemaForkedPayloadSchema>

export function renderSchemaForked(
  data: SchemaForkedPayload
): { message: string; routeData: NotificationRouteData } {
  return {
    message: `${data.forkedByUsername} forked your schema "${data.originalTitle}".`,
    routeData: {
      path: data.originalFormId != null ? `/collection/${data.originalFormId}` : `/schemas/${data.originalPid}`,
    },
  }
}
