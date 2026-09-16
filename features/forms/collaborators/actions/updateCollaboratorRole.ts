"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { updateCollaboratorRoleSchema } from "../schemas"

/**
 * OWNER-only. `role` is structurally restricted to EDITOR/VIEWER by
 * `updateCollaboratorRoleSchema` — ownership only ever moves via
 * `transferOwnership`, never through this action (docs/refactor/
 * form-collaboration.md §4.4). Works identically on a pending
 * (`acceptedAt: null`) row and an accepted one — the UI's "Invitation sent"
 * state is a display branch on the same data, not a different code path.
 */
export const updateCollaboratorRole = authenticatedAction(
  updateCollaboratorRoleSchema,
  async ({ input, userId }) => {
    await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")

    const collaborator = await prisma.markerFormCollaborator.findUnique({
      where: { id: input.collaboratorId },
    })
    if (!collaborator || collaborator.formId !== input.formId) {
      throw new ActionError("NOT_FOUND", "Collaborator not found")
    }

    await prisma.markerFormCollaborator.update({
      where: { id: input.collaboratorId },
      data: { role: input.role },
    })

    revalidatePath(`/collection/${input.formId}`)

    return { success: true }
  }
)
