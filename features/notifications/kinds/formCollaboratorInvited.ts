import { z } from "zod"
import { NotificationRouteData } from "../types"

export const formCollaboratorInvitedPayloadSchema = z.object({
  formId: z.number(),
  inviterUsername: z.string(),
  formTitle: z.string(),
  role: z.enum(["EDITOR", "VIEWER"]),
})

export type FormCollaboratorInvitedPayload = z.infer<typeof formCollaboratorInvitedPayloadSchema>

export function renderFormCollaboratorInvited(
  data: FormCollaboratorInvitedPayload
): { message: string; routeData: NotificationRouteData } {
  const roleLabel = data.role === "EDITOR" ? "an editor" : "a viewer"
  return {
    message: `${data.inviterUsername} invited you to collaborate on "${data.formTitle}" as ${roleLabel}.`,
    // getFormById now admits a still-pending invitee too (docs/refactor/
    // form-collaboration.md §6 item 2 follow-up), so the form page itself
    // can carry the accept/decline banner (PendingInviteBanner) — route
    // there directly instead of the dashboard's pending-invitations card.
    routeData: { path: `/collection/${data.formId}` },
  }
}
