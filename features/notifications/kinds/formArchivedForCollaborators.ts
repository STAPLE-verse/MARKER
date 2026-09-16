import { z } from "zod"
import { NotificationRouteData } from "../types"

export const formArchivedForCollaboratorsPayloadSchema = z.object({
  formTitle: z.string(),
})

export type FormArchivedForCollaboratorsPayload = z.infer<typeof formArchivedForCollaboratorsPayloadSchema>

export function renderFormArchivedForCollaborators(
  data: FormArchivedForCollaboratorsPayload
): { message: string; routeData: NotificationRouteData } {
  return {
    // Archived shared forms are never shown to collaborators (docs/refactor/
    // form-collaboration.md §4.3) — this is the only signal they get that the
    // form disappeared from "Shared with me" because it was archived, not
    // because they were removed (see formCollaboratorRemoved.ts).
    message: `"${data.formTitle}" was archived by its owner. You no longer have access to it.`,
    routeData: { path: "/collection" },
  }
}
