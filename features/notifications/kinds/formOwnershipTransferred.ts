import { z } from "zod"
import { NotificationRouteData } from "../types"

export const formOwnershipTransferredPayloadSchema = z.object({
  formId: z.number(),
  formTitle: z.string(),
  previousOwnerUsername: z.string(),
})

export type FormOwnershipTransferredPayload = z.infer<typeof formOwnershipTransferredPayloadSchema>

export function renderFormOwnershipTransferred(
  data: FormOwnershipTransferredPayload
): { message: string; routeData: NotificationRouteData } {
  return {
    message: `${data.previousOwnerUsername} made you the owner of "${data.formTitle}".`,
    // Unlike the archived/removed kinds, the new owner now has full access —
    // route straight to the form, not the collection list.
    routeData: { path: `/collection/${data.formId}` },
  }
}
