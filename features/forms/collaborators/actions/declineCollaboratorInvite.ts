"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { acceptOrDeclineInviteSchema } from "../schemas"

export const declineCollaboratorInvite = authenticatedAction(
  acceptOrDeclineInviteSchema,
  async ({ input, userId }) => {
    const invite = await prisma.markerFormCollaborator.findUnique({ where: { id: input.collaboratorId } })

    if (!invite || invite.userId !== userId) {
      throw new ActionError("NOT_FOUND", "Invitation not found")
    }
    if (invite.acceptedAt) {
      throw new ActionError(
        "CONFLICT",
        "You've already accepted this invitation — leave the form instead if you want to remove yourself."
      )
    }

    await prisma.markerFormCollaborator.delete({ where: { id: input.collaboratorId } })

    revalidatePath("/dashboard")

    return { success: true }
  }
)
