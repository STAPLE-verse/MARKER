import { z } from "zod"
import { NotificationRouteData } from "../types"

export const formCollaboratorRemovedPayloadSchema = z.object({
  formTitle: z.string(),
  initiatedBySelf: z.boolean(),
  actorUsername: z.string(),
})

export type FormCollaboratorRemovedPayload = z.infer<typeof formCollaboratorRemovedPayloadSchema>

export function renderFormCollaboratorRemoved(
  data: FormCollaboratorRemovedPayload
): { message: string; routeData: NotificationRouteData } {
  // Fired whether the removal was owner-initiated or self-initiated (docs/
  // refactor/form-collaboration.md §4.5), so "you were removed" and "you
  // left" are both explained rather than the form silently vanishing.
  const message = data.initiatedBySelf
    ? `You left "${data.formTitle}".`
    : `${data.actorUsername} removed you from "${data.formTitle}".`
  return { message, routeData: { path: "/collection" } }
}
