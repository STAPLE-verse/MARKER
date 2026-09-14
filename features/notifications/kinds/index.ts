import { z } from "zod"
import { NotificationRouteData } from "../types"
import { schemaForkedPayloadSchema, renderSchemaForked, SchemaForkedPayload } from "./schemaForked"
import {
  schemaForkPublishedPayloadSchema,
  renderSchemaForkPublished,
  SchemaForkPublishedPayload,
} from "./schemaForkPublished"
import {
  forkedSchemaUpdatedPayloadSchema,
  renderForkedSchemaUpdated,
  ForkedSchemaUpdatedPayload,
} from "./forkedSchemaUpdated"

/**
 * The registry STAPLE never quite had: `templateId` there was a bare string
 * matched at runtime against a separate schema map and a separate .hbs file
 * on disk, with nothing tying the three together at compile time (its sixth
 * template, `assignedLabel.hbs`, drifted out of sync with the schema map
 * entirely — a dead stub nothing ever caught). Here, `NotificationKind`,
 * `NotificationKindPayloadMap`, and `NOTIFICATION_KINDS` all key off the same
 * literal union, so adding a kind without wiring up its payload type is a
 * compile error, not a silent runtime gap.
 */
export type NotificationKind = "SCHEMA_FORKED" | "SCHEMA_FORK_PUBLISHED" | "FORKED_SCHEMA_UPDATED"

export interface NotificationKindPayloadMap {
  SCHEMA_FORKED: SchemaForkedPayload
  SCHEMA_FORK_PUBLISHED: SchemaForkPublishedPayload
  FORKED_SCHEMA_UPDATED: ForkedSchemaUpdatedPayload
}

interface NotificationKindDefinition<TPayload> {
  payloadSchema: z.ZodType<TPayload>
  render: (data: TPayload) => { message: string; routeData: NotificationRouteData }
}

export const NOTIFICATION_KINDS: {
  [K in NotificationKind]: NotificationKindDefinition<NotificationKindPayloadMap[K]>
} = {
  SCHEMA_FORKED: {
    payloadSchema: schemaForkedPayloadSchema,
    render: renderSchemaForked,
  },
  SCHEMA_FORK_PUBLISHED: {
    payloadSchema: schemaForkPublishedPayloadSchema,
    render: renderSchemaForkPublished,
  },
  FORKED_SCHEMA_UPDATED: {
    payloadSchema: forkedSchemaUpdatedPayloadSchema,
    render: renderForkedSchemaUpdated,
  },
}
