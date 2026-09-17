"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { acceptOrDeclineInviteSchema } from "../schemas"

/**
 * Authorized by `collaborator.userId === userId`, not form ownership or role
 * — this is the invitee accepting their own invite, independent of what
 * access (if any) they'd otherwise have to the form.
 */
export const acceptCollaboratorInvite = authenticatedAction(
  acceptOrDeclineInviteSchema,
  async ({ input, userId }) => {
    const invite = await prisma.markerFormCollaborator.findUnique({ where: { id: input.collaboratorId } })

    if (!invite || invite.userId !== userId) {
      throw new ActionError("NOT_FOUND", "Invitation not found")
    }
    if (invite.acceptedAt) {
      throw new ActionError("CONFLICT", "This invitation has already been accepted.")
    }

    await prisma.markerFormCollaborator.update({
      where: { id: input.collaboratorId },
      data: { acceptedAt: new Date() },
    })

    revalidatePath("/dashboard")
    revalidatePath(`/collection/${invite.formId}`)

    return { success: true, formId: invite.formId }
  }
)
