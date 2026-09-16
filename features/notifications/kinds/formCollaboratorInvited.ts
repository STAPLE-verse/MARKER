import { z } from "zod"
import { NotificationRouteData } from "../types"

export const formCollaboratorInvitedPayloadSchema = z.object({
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
    // No dedicated invite page — the dashboard's pending-invitations card
    // (docs/refactor/form-collaboration.md §6 item 2) is where this is acted on.
    routeData: { path: "/dashboard" },
  }
}
